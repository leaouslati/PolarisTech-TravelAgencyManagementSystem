const db = require('../config/db');
const { notifyUser } = require('../utils/notify');
const getPackages = async (req, res) => {
  try {
    const agentId = req.user.user_id;

    const [packages] = await db.query(
      `SELECT
         tp.package_id,
         tp.package_name,
         d.city        AS destination_city,
         d.country     AS destination_country,
         tp.travel_date,
         tp.total_price,
         tp.available_slots,
         tp.status_availability
       FROM TravelPackages tp
       JOIN Destinations d ON tp.destination_id = d.destination_id
       WHERE tp.staff_id = ?`,
      [agentId]
    );

    const formatted = packages.map((pkg) => ({
      package_id: pkg.package_id,
      package_name: pkg.package_name,
      destination: {
        city: pkg.destination_city,
        country: pkg.destination_country,
      },
      travel_date: pkg.travel_date,
      total_price: pkg.total_price,
      available_slots: pkg.available_slots,
      status_availability: pkg.status_availability,
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
      const moodRows = moods.map((mood_id) => [newPackageId, mood_id]);
      await db.query(
        'INSERT INTO PackageMoods (package_id, mood_id) VALUES ?',
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
      `INSERT INTO PackageUpdateRequests (package_id, staff_id, proposed_changes, status)
       VALUES (?, ?, ?, 'pending')`,
      [packageId, agentId, JSON.stringify(proposedChanges)]
    );

    // Set package status to pending_approval
    await db.query(
      "UPDATE TravelPackages SET status_availability = 'pending_approval' WHERE package_id = ?",
      [packageId]
    );

    // Notify admin
    await notifyUser(
      null, // admin — use your system's method to target admin
      `Agent ${req.user.name} submitted changes to package "${pkg.package_name}" for your review`,
      { role: 'admin' }
    );

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
         CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
         tp.package_name,
         tp.travel_date,
         b.num_travelers,
         b.total_price,
         b.status,
         b.created_at,
         GROUP_CONCAT(ao.add_on_name SEPARATOR ', ') AS add_ons
       FROM Bookings b
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       JOIN Users u          ON b.user_id = u.user_id
       LEFT JOIN BookingAddOns bao ON b.booking_id = bao.booking_id
       LEFT JOIN AddOns ao         ON bao.add_on_id = ao.add_on_id
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
      booking.user_id,
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
      booking.user_id,
      `Your booking ${formattedId} has been declined by the agent`
    );

    return res.status(200).json({ status: 'success', message: 'Booking declined' });
  } catch (error) {
    console.error('declineBooking error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getBookings,
  approveBooking,
  declineBooking,
};
