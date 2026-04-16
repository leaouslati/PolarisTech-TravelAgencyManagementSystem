const db = require('../db/connection');
const notifyUser = require('../utils/notifyUser');

const getDestinations = async (req, res) => {
  try {
    const [destinations] = await db.query(
      'SELECT destination_id, city, country FROM Destinations ORDER BY country, city'
    );
    return res.status(200).json({ status: 'success', data: destinations });
  } catch (error) {
    console.error('getDestinations error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getPackages = async (req, res) => {
  try {
    const agentId = req.user.user_id;

    const [packages] = await db.query(
      `SELECT
         tp.package_id,
         tp.package_name,
         tp.destination_id,
         d.city        AS destination_city,
         d.country     AS destination_country,
         tp.travel_date,
         tp.return_date,
         tp.duration,
         tp.total_price,
         tp.description,
         tp.available_slots,
         tp.status_availability
       FROM TravelPackages tp
       JOIN Destinations d ON tp.destination_id = d.destination_id
       WHERE tp.staff_id = ? AND tp.status_availability != 'inactive'`,
      [agentId]
    );

    // Fetch moods for all packages in one query
    const packageIds = packages.map(p => p.package_id);
    let moodsMap = {};
    if (packageIds.length > 0) {
      const [moods] = await db.query(
        `SELECT package_id, mood FROM PackageMoods WHERE package_id IN (?)`,
        [packageIds]
      );
      moods.forEach(m => {
        if (!moodsMap[m.package_id]) moodsMap[m.package_id] = [];
        moodsMap[m.package_id].push(m.mood);
      });
    }

    const formatted = packages.map((pkg) => ({
      package_id: pkg.package_id,
      package_name: pkg.package_name,
      destination_id: pkg.destination_id,
      destination: {
        city: pkg.destination_city,
        country: pkg.destination_country,
      },
      travel_date: pkg.travel_date,
      return_date: pkg.return_date,
      duration: pkg.duration,
      total_price: pkg.total_price,
      description: pkg.description,
      available_slots: pkg.available_slots,
      status_availability: pkg.status_availability,
      moods: moodsMap[pkg.package_id] || [],
    }));

    return res.status(200).json({ status: 'success', data: formatted });
  } catch (error) {
    console.error('getPackages error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const createPackage = async (req, res) => {
  try {
    const agentId = req.user.user_id;
    const {
      package_name,
      destination_id,
      travel_date,
      return_date,
      duration,
      total_price,
      description,
      available_slots,
      moods,
    } = req.body;

    // Validate required fields
    if (
      !package_name ||
      !destination_id ||
      !travel_date ||
      !return_date ||
      !duration ||
      !total_price ||
      !description ||
      available_slots === undefined
    ) {
      return res
        .status(400)
        .json({ status: 'error', message: 'All fields are required' });
    }

    // Validate travel_date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const travelDateObj = new Date(travel_date);
    if (travelDateObj <= today) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Travel date must be a future date' });
    }

    // Insert into TravelPackages
    const [result] = await db.query(
      `INSERT INTO TravelPackages
         (package_name, destination_id, travel_date, return_date, duration,
          total_price, description, available_slots, staff_id, status_availability)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        package_name,
        destination_id,
        travel_date,
        return_date,
        duration,
        total_price,
        description,
        available_slots,
        agentId,
      ]
    );

    const newPackageId = result.insertId;

    // Insert moods if provided
    if (moods && Array.isArray(moods) && moods.length > 0) {
      const moodRows = moods.map((mood) => [newPackageId, mood]);
      await db.query(
        'INSERT INTO PackageMoods (package_id, mood) VALUES ?',
        [moodRows]
      );
    }

    return res.status(201).json({
      status: 'success',
      message: 'Package created successfully',
      data: {
        package_id: newPackageId,
        package_name,
        destination_id,
        travel_date,
        return_date,
        duration,
        total_price,
        description,
        available_slots,
        status_availability: 'active',
      },
    });
  } catch (error) {
    console.error('createPackage error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
const updatePackage = async (req, res) => {
  try {
    const agentId = req.user.user_id;
    const { packageId } = req.params;

    // Check the package belongs to this agent
    const [packages] = await db.query(
      'SELECT * FROM TravelPackages WHERE package_id = ? AND staff_id = ?',
      [packageId, agentId]
    );

    if (packages.length === 0) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Package not found or access denied' });
    }

    const pkg = packages[0];

    // Save proposed changes as JSON in PackageUpdateRequests
    const proposedChanges = req.body;
    await db.query(
      `INSERT INTO PackageUpdateRequests (package_id, agent_id, updated_data, status)
       VALUES (?, ?, ?, 'pending')`,
      [packageId, agentId, JSON.stringify(proposedChanges)]
    );

    // Set package status to pending_approval
    await db.query(
      "UPDATE TravelPackages SET status_availability = 'pending_approval' WHERE package_id = ?",
      [packageId]
    );

    // Notify admin
    const [admins] = await db.query(
      "SELECT user_id FROM Users WHERE role = 'Administrator' LIMIT 1"
    );
    if (admins.length > 0) {
      await notifyUser(
        admins[0].user_id,
        `Agent ${req.user.full_name} submitted changes to package "${pkg.package_name}" for your review`
      );
    }

    return res.status(200).json({
      status: 'success',
      message: 'Package update submitted for admin approval',
    });
  } catch (error) {
    console.error('updatePackage error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const deletePackage = async (req, res) => {
  try {
    const agentId = req.user.user_id;
    const { packageId } = req.params;

    // Check package belongs to this agent
    const [packages] = await db.query(
      'SELECT * FROM TravelPackages WHERE package_id = ? AND staff_id = ?',
      [packageId, agentId]
    );

    if (packages.length === 0) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Package not found or access denied' });
    }

    // Check for confirmed bookings
    const [bookings] = await db.query(
      "SELECT booking_id FROM Bookings WHERE package_id = ? AND status = 'confirmed'",
      [packageId]
    );

    if (bookings.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete a package with active bookings',
      });
    }

    // Soft delete — set status to inactive
    await db.query(
      "UPDATE TravelPackages SET status_availability = 'inactive' WHERE package_id = ?",
      [packageId]
    );

    return res.status(200).json({ status: 'success', message: 'Package removed' });
  } catch (error) {
    console.error('deletePackage error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
const getBookings = async (req, res) => {
  try {
    const agentId = req.user.user_id;

    const [bookings] = await db.query(
      `SELECT
         b.booking_id,
         u.full_name AS customer_name,
         tp.package_name,
         tp.travel_date,
         b.num_travelers,
         b.total_price,
         b.status,
         b.booking_date AS created_at,
         GROUP_CONCAT(ao.name SEPARATOR ', ') AS add_ons
       FROM Bookings b
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       JOIN Users u           ON b.customer_id = u.user_id
       LEFT JOIN BookingAddOns bao ON b.booking_id = bao.booking_id
       LEFT JOIN AddOns ao         ON bao.addon_id = ao.addon_id
       WHERE tp.staff_id = ?
       GROUP BY b.booking_id`,
      [agentId]
    );

    return res.status(200).json({ status: 'success', data: bookings });
  } catch (error) {
    console.error('getBookings error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
const approveBooking = async (req, res) => {
  try {
    const agentId = req.user.user_id;
    const { bookingId } = req.params;

    const [bookings] = await db.query(
      `SELECT b.*, tp.package_name
       FROM Bookings b
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       WHERE b.booking_id = ? AND tp.staff_id = ?`,
      [bookingId, agentId]
    );

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Booking not found or access denied' });
    }

    const booking = bookings[0];
    if (booking.status !== 'pending') {
      return res
        .status(400)
        .json({ status: 'error', message: 'This booking has already been processed' });
    }
    await db.query(
      "UPDATE Bookings SET status = 'confirmed' WHERE booking_id = ?",
      [bookingId]
    );
    const formattedId = `BK-${String(bookingId).padStart(4, '0')}`;
    await notifyUser(
      booking.customer_id,
      `Your booking ${formattedId} has been approved. Please proceed to payment`
    );

    return res.status(200).json({ status: 'success', message: 'Booking approved' });
  } catch (error) {
    console.error('approveBooking error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
const declineBooking = async (req, res) => {
  try {
    const agentId = req.user.user_id;
    const { bookingId } = req.params;

    // Verify booking belongs to one of this agent's packages
    const [bookings] = await db.query(
      `SELECT b.*, tp.package_name
       FROM Bookings b
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       WHERE b.booking_id = ? AND tp.staff_id = ?`,
      [bookingId, agentId]
    );

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Booking not found or access denied' });
    }

    const booking = bookings[0];

    // Update booking to cancelled
    await db.query(
      "UPDATE Bookings SET status = 'cancelled' WHERE booking_id = ?",
      [bookingId]
    );

    // Increment available_slots to free up the slot
    await db.query(
      'UPDATE TravelPackages SET available_slots = available_slots + 1 WHERE package_id = ?',
      [booking.package_id]
    );

    // Notify customer
    const formattedId = `BK-${String(bookingId).padStart(4, '0')}`;
    await notifyUser(
      booking.customer_id,
      `Your booking ${formattedId} has been declined by the agent`
    );

    return res.status(200).json({ status: 'success', message: 'Booking declined' });
  } catch (error) {
    console.error('declineBooking error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  getDestinations,
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getBookings,
  approveBooking,
  declineBooking,
};
