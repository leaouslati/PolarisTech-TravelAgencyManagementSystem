const db = require('../db/connection');
const notifyUser = require('../utils/notifyUser'); // default export, NOT destructured

// ─────────────────────────────────────────────
// GET /agent/packages
// ─────────────────────────────────────────────
exports.getAgentPackages = async (req, res) => {
  const agentId = req.user.user_id;
  try {
    const [rows] = await db.query(`
      SELECT
        tp.package_id,
        tp.package_name,
        tp.destination_id,
        d.city,
        d.country,
        tp.total_price,
        tp.travel_date,
        tp.return_date,
        tp.duration,
        tp.description,
        tp.status_availability,
        tp.available_slots
      FROM TravelPackages tp
      JOIN Destinations d ON d.destination_id = tp.destination_id
      WHERE tp.staff_id = ? AND tp.status_availability != 'inactive'
      ORDER BY tp.created_at DESC
    `, [agentId]);

    if (rows.length > 0) {
      const ids = rows.map(p => p.package_id);
      const placeholders = ids.map(() => '?').join(',');

      const [moodRows] = await db.query(
        `SELECT package_id, mood FROM PackageMoods WHERE package_id IN (${placeholders})`, ids
      );
      const [hotelRows] = await db.query(
        `SELECT package_id, hotel_id FROM PackageHotels WHERE package_id IN (${placeholders})`, ids
      );
      const [flightRows] = await db.query(
        `SELECT package_id, flight_id FROM PackageFlights WHERE package_id IN (${placeholders})`, ids
      );
      const [tourRows] = await db.query(
        `SELECT package_id, tour_id FROM PackageTours WHERE package_id IN (${placeholders})`, ids
      );
      const [addonRows] = await db.query(
        `SELECT package_id, addon_id, name, price FROM AddOns WHERE package_id IN (${placeholders})`, ids
      );

      const toMap = (arr, key, val) => arr.reduce((acc, r) => {
        (acc[r.package_id] = acc[r.package_id] || []).push(val(r));
        return acc;
      }, {});

      const moodMap   = toMap(moodRows,   'mood',      r => r.mood);
      const hotelMap  = toMap(hotelRows,  'hotel_id',  r => r.hotel_id);
      const flightMap = toMap(flightRows, 'flight_id', r => r.flight_id);
      const tourMap   = toMap(tourRows,   'tour_id',   r => r.tour_id);
      const addonMap  = toMap(addonRows,  'addon_id',  r => ({ addon_id: r.addon_id, name: r.name, price: r.price }));

      rows.forEach(p => {
        p.destination = { city: p.city, country: p.country };
        p.moods      = moodMap[p.package_id]   || [];
        p.hotel_ids  = hotelMap[p.package_id]  || [];
        p.flight_ids = flightMap[p.package_id] || [];
        p.tour_ids   = tourMap[p.package_id]   || [];
        p.addons     = addonMap[p.package_id]  || [];
      });
    }

    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load packages' });
  }
};

// ─────────────────────────────────────────────
// GET /agent/destinations
// ─────────────────────────────────────────────
exports.getDestinations = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT destination_id, city, country FROM Destinations ORDER BY country, city'
    );
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load destinations' });
  }
};

// GET /agent/hotels?destination_id=X
exports.getHotels = async (req, res) => {
  const { destination_id } = req.query;
  try {
    const [rows] = destination_id
      ? await db.query(
          'SELECT hotel_id, hotel_name, room_types, price_per_night, rating FROM Hotels WHERE destination_id = ? AND status_availability = 1',
          [destination_id]
        )
      : await db.query(
          'SELECT hotel_id, hotel_name, room_types, price_per_night, rating FROM Hotels WHERE status_availability = 1'
        );
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load hotels' });
  }
};

// GET /agent/flights
exports.getFlights = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT flight_id, airline_name, departure_location, arrival_location, departure_time, arrival_time, seat_availability, price FROM Flights ORDER BY departure_time'
    );
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load flights' });
  }
};

// GET /agent/tours?destination_id=X
exports.getTours = async (req, res) => {
  const { destination_id } = req.query;
  try {
    const [rows] = destination_id
      ? await db.query(
          'SELECT tour_id, tour_name, duration, included_services, price FROM Tours WHERE destination_id = ?',
          [destination_id]
        )
      : await db.query(
          'SELECT tour_id, tour_name, duration, included_services, price FROM Tours'
        );
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load tours' });
  }
};

// ─────────────────────────────────────────────
// POST /agent/packages
// ─────────────────────────────────────────────
exports.createPackage = async (req, res) => {
  const agentId = req.user.user_id;
  const {
    package_name, destination_id, travel_date, return_date,
    duration, total_price, description, available_slots,
    moods = [], hotel_ids = [], flight_ids = [], tour_ids = [], addons = [],
  } = req.body;

  try {
    if (!package_name || !destination_id || !travel_date || !return_date ||
        !duration || !total_price || !available_slots || !description) {
      return res.status(400).json({ status: 'error', message: 'All required fields must be provided' });
    }

    const [result] = await db.query(
      `INSERT INTO TravelPackages
        (package_name, destination_id, staff_id, total_price, travel_date, return_date, duration, description, available_slots, status_availability)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [package_name, destination_id, agentId, total_price, travel_date, return_date, duration, description, available_slots]
    );

    const packageId = result.insertId;

    for (const mood of moods) {
      await db.query('INSERT INTO PackageMoods (package_id, mood) VALUES (?, ?)', [packageId, mood]);
    }
    for (const hid of hotel_ids) {
      await db.query('INSERT INTO PackageHotels (package_id, hotel_id) VALUES (?, ?)', [packageId, hid]);
    }
    for (const fid of flight_ids) {
      await db.query('INSERT INTO PackageFlights (package_id, flight_id) VALUES (?, ?)', [packageId, fid]);
    }
    for (const tid of tour_ids) {
      await db.query('INSERT INTO PackageTours (package_id, tour_id) VALUES (?, ?)', [packageId, tid]);
    }
    for (const addon of addons) {
      if (addon.name && addon.price) {
        await db.query('INSERT INTO AddOns (package_id, name, price) VALUES (?, ?, ?)', [packageId, addon.name, addon.price]);
      }
    }

    res.status(201).json({ status: 'success', data: { package_id: packageId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to create package' });
  }
};

// ─────────────────────────────────────────────
// PUT /agent/packages/:id  — submits update for admin approval
// ─────────────────────────────────────────────
exports.updatePackage = async (req, res) => {
  const agentId = req.user.user_id;
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT package_id, status_availability FROM TravelPackages WHERE package_id = ? AND staff_id = ?',
      [id, agentId]
    );

    if (rows.length === 0)
      return res.status(404).json({ status: 'error', message: 'Package not found' });

    if (rows[0].status_availability === 'pending_approval')
      return res.status(400).json({ status: 'error', message: 'An update is already pending approval for this package' });

    await db.query(
      `INSERT INTO PackageUpdateRequests (package_id, agent_id, updated_data, status) VALUES (?, ?, ?, 'pending')`,
      [id, agentId, JSON.stringify(req.body)]
    );
    await db.query(
      `UPDATE TravelPackages SET status_availability = 'pending_approval' WHERE package_id = ?`,
      [id]
    );

    res.json({ status: 'success', message: 'Update submitted for admin approval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to submit update' });
  }
};

// ─────────────────────────────────────────────
// DELETE /agent/packages/:id  — soft delete
// ─────────────────────────────────────────────
exports.deletePackage = async (req, res) => {
  const agentId = req.user.user_id;
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT package_id FROM TravelPackages WHERE package_id = ? AND staff_id = ?',
      [id, agentId]
    );
    if (rows.length === 0)
      return res.status(404).json({ status: 'error', message: 'Package not found' });

    const [[{ active_count }]] = await db.query(
      `SELECT COUNT(*) AS active_count FROM Bookings WHERE package_id = ? AND status IN ('pending','confirmed')`,
      [id]
    );
    if (active_count > 0)
      return res.status(400).json({ status: 'error', message: 'Cannot remove a package with active bookings' });

    await db.query(
      `UPDATE TravelPackages SET status_availability = 'inactive' WHERE package_id = ?`,
      [id]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to delete package' });
  }
};

// ─────────────────────────────────────────────
// GET /agent/bookings
// ─────────────────────────────────────────────
exports.getAgentBookings = async (req, res) => {
  const agentId = req.user.user_id;
  try {
    const [rows] = await db.query(`
      SELECT
        b.booking_id,
        u.full_name AS customer_name,
        tp.package_name,
        b.travel_date,
        b.num_travelers,
        GROUP_CONCAT(a.name ORDER BY a.addon_id SEPARATOR ', ') AS addons,
        b.total_price,
        b.status
      FROM Bookings b
      JOIN Users u ON u.user_id = b.customer_id
      JOIN TravelPackages tp ON tp.package_id = b.package_id
      LEFT JOIN BookingAddOns ba ON ba.booking_id = b.booking_id
      LEFT JOIN AddOns a ON a.addon_id = ba.addon_id
      WHERE tp.staff_id = ?
      GROUP BY b.booking_id, u.full_name, tp.package_name,
               b.travel_date, b.num_travelers, b.total_price, b.status, b.booking_date
      ORDER BY b.booking_date DESC
    `, [agentId]);

    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load bookings' });
  }
};

// ─────────────────────────────────────────────
// PATCH /agent/bookings/:bookingId/approve
// ─────────────────────────────────────────────
exports.approveBooking = async (req, res) => {
  const { bookingId } = req.params;
  const agentId = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT b.booking_id, b.customer_id, b.status
       FROM Bookings b
       JOIN TravelPackages tp ON tp.package_id = b.package_id
       WHERE b.booking_id = ? AND tp.staff_id = ?`,
      [bookingId, agentId]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Booking not found' });

    // Guard: prevent double-processing
    if (rows[0].status === 'confirmed' || rows[0].status === 'cancelled')
      return res.status(400).json({ status: 'error', message: 'This booking has already been processed' });

    await db.query('UPDATE Bookings SET status = "confirmed" WHERE booking_id = ?', [bookingId]);
    await notifyUser(rows[0].customer_id, `Your booking ${bookingId} has been approved by your travel agent`);

    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to approve booking' });
  }
};

// ─────────────────────────────────────────────
// PATCH /agent/bookings/:bookingId/decline
// ─────────────────────────────────────────────
exports.declineBooking = async (req, res) => {
  const { bookingId } = req.params;
  const agentId = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT b.booking_id, b.customer_id, b.status, b.package_id
       FROM Bookings b
       JOIN TravelPackages tp ON tp.package_id = b.package_id
       WHERE b.booking_id = ? AND tp.staff_id = ?`,
      [bookingId, agentId]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Booking not found' });

    // Guard: prevent double-processing
    if (rows[0].status === 'confirmed' || rows[0].status === 'cancelled')
      return res.status(400).json({ status: 'error', message: 'This booking has already been processed' });

    await db.query('UPDATE Bookings SET status = "cancelled" WHERE booking_id = ?', [bookingId]);
    await db.query(
      'UPDATE TravelPackages SET available_slots = available_slots + 1 WHERE package_id = ?',
      [rows[0].package_id]
    );
    await notifyUser(rows[0].customer_id, `Your booking ${bookingId} has been declined by your travel agent`);

    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to decline booking' });
  }
};

// ─────────────────────────────────────────────
// GET /agent/cancellations
// ─────────────────────────────────────────────
exports.getCancellationRequests = async (req, res) => {
  const agentId = req.user.user_id;
  try {
    const [rows] = await db.query(`
      SELECT
        cr.cancel_id,
        cr.booking_id,
        u.full_name AS customer_name,
        tp.package_name,
        cr.reason,
        cr.status,
        cr.created_at
      FROM CancellationRequests cr
      JOIN Bookings b ON b.booking_id = cr.booking_id
      JOIN Users u ON u.user_id = b.customer_id
      JOIN TravelPackages tp ON tp.package_id = b.package_id
      WHERE tp.staff_id = ?
      ORDER BY cr.created_at DESC
    `, [agentId]);

    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load cancellation requests' });
  }
};

// ─────────────────────────────────────────────
// PATCH /agent/cancellations/:cancelId/approve  — transactional
// ─────────────────────────────────────────────
exports.approveCancellation = async (req, res) => {
  const { cancelId } = req.params;
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM CancellationRequests WHERE cancel_id = ? FOR UPDATE',
      [cancelId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Not found' });
    }

    const c = rows[0];

    // Guard: prevent double-processing
    if (c.status === 'approved' || c.status === 'rejected') {
      await conn.rollback();
      return res.status(400).json({ status: 'error', message: 'This cancellation request has already been reviewed' });
    }

    const [bookingRows] = await conn.query(
      'SELECT customer_id, total_price FROM Bookings WHERE booking_id = ?',
      [c.booking_id]
    );
    const booking = bookingRows[0];

    await conn.query('UPDATE CancellationRequests SET status = "approved" WHERE cancel_id = ?', [cancelId]);
    await conn.query('UPDATE Bookings SET status = "cancelled" WHERE booking_id = ?', [c.booking_id]);
    await conn.query(
      `UPDATE TravelPackages SET available_slots = available_slots + 1
       WHERE package_id = (SELECT package_id FROM Bookings WHERE booking_id = ?)`,
      [c.booking_id]
    );
    // Mark the payment as failed (reversed/refunded)
    await conn.query(
      `UPDATE Payments SET payment_status = 'failed' WHERE booking_id = ? AND payment_status = 'paid'`,
      [c.booking_id]
    );
    await conn.commit();

    await notifyUser(
      booking.customer_id,
      `Your cancellation request for booking ${c.booking_id} has been approved. A refund of $${Number(booking.total_price).toFixed(2)} has been initiated.`
    );

    res.json({ status: 'success' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to approve cancellation' });
  } finally {
    if (conn) conn.release();
  }
};

// ─────────────────────────────────────────────
// PATCH /agent/cancellations/:cancelId/reject
// ─────────────────────────────────────────────
exports.rejectCancellation = async (req, res) => {
  const { cancelId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM CancellationRequests WHERE cancel_id = ?', [cancelId]);
    if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Not found' });

    const c = rows[0];
    if (c.status !== 'pending') return res.status(400).json({ status: 'error', message: 'Already reviewed' });

    await db.query('UPDATE CancellationRequests SET status = "rejected" WHERE cancel_id = ?', [cancelId]);
    await notifyUser(
      c.user_id,
      `Your cancellation request for booking ${c.booking_id} has been rejected. Your booking remains active`
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to reject cancellation' });
  }
};

// ─────────────────────────────────────────────
// POST /agent/messages/:bookingId
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  const { bookingId } = req.params;
  const { content } = req.body;
  const senderId = req.user.user_id;

  try {
    if (!content || !content.trim())
      return res.status(400).json({ status: 'error', message: 'Content required' });

    const [result] = await db.query(
      'INSERT INTO Messages (booking_id, sender_id, content) VALUES (?, ?, ?)',
      [bookingId, senderId, content.trim()]
    );

    const [rows] = await db.query(`
      SELECT m.message_id, m.sender_id, u.full_name AS sender_name, u.role AS sender_role, m.content, m.sent_at
      FROM Messages m
      JOIN Users u ON u.user_id = m.sender_id
      WHERE m.message_id = ?
    `, [result.insertId]);

    res.json({ status: 'success', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to send message' });
  }
};

// ─────────────────────────────────────────────
// GET /agent/messages/:bookingId
// ─────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT m.message_id, m.sender_id, u.full_name AS sender_name, u.role AS sender_role, m.content, m.sent_at
      FROM Messages m
      JOIN Users u ON u.user_id = m.sender_id
      WHERE m.booking_id = ?
      ORDER BY m.sent_at ASC
    `, [bookingId]);

    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load messages' });
  }
};

// ─────────────────────────────────────────────
// GET /agent/notifications
// ─────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [rows] = await db.query(
      'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load notifications' });
  }
};