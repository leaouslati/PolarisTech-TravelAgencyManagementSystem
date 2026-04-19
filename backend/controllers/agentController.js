const db = require('../db/connection');
const notifyUser = require('../utils/notifyUser');

// ─────────────────────────────────────────────
// Route 1 — GET agent bookings
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

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 2 — APPROVE booking
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

    if (rows[0].status !== 'pending')
      return res.status(400).json({ message: 'Booking is not pending' });

    await db.query(
      'UPDATE Bookings SET status = "confirmed" WHERE booking_id = ?',
      [bookingId]
    );

    await notifyUser(
      rows[0].customer_id,
      `Your booking ${bookingId} has been approved by your travel agent`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 3 — DECLINE booking
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

    if (rows[0].status !== 'pending')
      return res.status(400).json({ message: 'Booking is not pending' });

    await db.query(
      'UPDATE Bookings SET status = "cancelled" WHERE booking_id = ?',
      [bookingId]
    );

    await db.query(
      'UPDATE TravelPackages SET available_slots = available_slots + 1 WHERE package_id = ?',
      [rows[0].package_id]
    );

    await notifyUser(
      rows[0].customer_id,
      `Your booking ${bookingId} has been declined by your travel agent`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 4 — GET cancellations
// ─────────────────────────────────────────────
exports.getCancellationRequests = async (req, res) => {
  try {
    const agentId = req.user.user_id;

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

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 5 — APPROVE cancellation (transactional)
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

    const cancellation = rows[0];

    if (cancellation.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ message: 'Cancellation already reviewed' });
    }

    await conn.query(
      'UPDATE CancellationRequests SET status = "approved" WHERE cancel_id = ?',
      [cancelId]
    );

    await conn.query(
      'UPDATE Bookings SET status = "cancelled" WHERE booking_id = ?',
      [cancellation.booking_id]
    );

    await conn.query(
      `UPDATE TravelPackages SET available_slots = available_slots + 1
       WHERE package_id = (SELECT package_id FROM Bookings WHERE booking_id = ?)`,
      [cancellation.booking_id]
    );

    await conn.commit();

    const bookingCode = cancellation.booking_id;
    await notifyUser(
      cancellation.user_id,
      `Your cancellation request for booking ${bookingCode} has been approved. A refund will be processed`
    );

    res.json({ success: true });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false });
  } finally {
    if (conn) conn.release();
  }
};

// ─────────────────────────────────────────────
// Route 6 — REJECT cancellation
// ─────────────────────────────────────────────
exports.rejectCancellation = async (req, res) => {
  const { cancelId } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM CancellationRequests WHERE cancel_id = ?',
      [cancelId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Not found' });

    const cancellation = rows[0];

    if (cancellation.status !== 'pending')
      return res.status(400).json({ message: 'Cancellation already reviewed' });

    await db.query(
      'UPDATE CancellationRequests SET status = "rejected" WHERE cancel_id = ?',
      [cancelId]
    );

    const bookingCode = cancellation.booking_id;
    await notifyUser(
      cancellation.user_id,
      `Your cancellation request for booking ${bookingCode} has been rejected. Your booking remains active`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 7 — SEND message
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  const { bookingId } = req.params;
  const { content } = req.body;
  const senderId = req.user.user_id;

  try {
    if (!content || !content.trim())
      return res.status(400).json({ message: 'Content required' });

    const [result] = await db.query(
      'INSERT INTO Messages (booking_id, sender_id, content) VALUES (?, ?, ?)',
      [bookingId, senderId, content.trim()]
    );

    const [rows] = await db.query(`
      SELECT
        m.message_id,
        m.sender_id,
        u.full_name AS sender_name,
        u.role AS sender_role,
        m.content,
        m.sent_at
      FROM Messages m
      JOIN Users u ON u.user_id = m.sender_id
      WHERE m.message_id = ?
    `, [result.insertId]);

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 8 — GET messages
// ─────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT
        m.message_id,
        m.sender_id,
        u.full_name AS sender_name,
        u.role AS sender_role,
        m.content,
        m.sent_at
      FROM Messages m
      JOIN Users u ON u.user_id = m.sender_id
      WHERE m.booking_id = ?
      ORDER BY m.sent_at ASC
    `, [bookingId]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 9 — GET notifications
// ─────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const [rows] = await db.query(
      'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 10 — GET agent packages
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
      const [moodRows] = await db.query(
        `SELECT package_id, mood FROM PackageMoods WHERE package_id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      const moodMap = moodRows.reduce((acc, m) => {
        (acc[m.package_id] = acc[m.package_id] || []).push(m.mood);
        return acc;
      }, {});

      rows.forEach(p => {
        p.destination = { city: p.city, country: p.country };
        p.moods = moodMap[p.package_id] || [];
      });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 11 — GET all destinations
// ─────────────────────────────────────────────
exports.getDestinations = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT destination_id, city, country FROM Destinations ORDER BY country, city'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 12 — CREATE package
// ─────────────────────────────────────────────
exports.createPackage = async (req, res) => {
  const agentId = req.user.user_id;
  const {
    package_name, destination_id, travel_date, return_date,
    duration, total_price, description, available_slots, moods = [],
  } = req.body;

  try {
    if (!package_name || !destination_id || !travel_date || !return_date ||
        !duration || !total_price || !available_slots || !description) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const [result] = await db.query(
      `INSERT INTO TravelPackages
        (package_name, destination_id, staff_id, total_price, travel_date, return_date, duration, description, available_slots, status_availability)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [package_name, destination_id, agentId, total_price, travel_date, return_date, duration, description, available_slots]
    );

    const packageId = result.insertId;

    for (const mood of moods) {
      await db.query(
        'INSERT INTO PackageMoods (package_id, mood) VALUES (?, ?)',
        [packageId, mood]
      );
    }

    res.status(201).json({ success: true, data: { package_id: packageId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 13 — UPDATE package (via admin approval)
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
      return res.status(404).json({ message: 'Package not found' });

    if (rows[0].status_availability === 'pending_approval')
      return res.status(400).json({ message: 'An update is already pending approval for this package' });

    await db.query(
      `INSERT INTO PackageUpdateRequests (package_id, agent_id, updated_data, status)
       VALUES (?, ?, ?, 'pending')`,
      [id, agentId, JSON.stringify(req.body)]
    );

    await db.query(
      `UPDATE TravelPackages SET status_availability = 'pending_approval' WHERE package_id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Update submitted for admin approval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 14 — DELETE package (soft delete)
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
      return res.status(404).json({ message: 'Package not found' });

    const [[{ active_count }]] = await db.query(
      `SELECT COUNT(*) AS active_count FROM Bookings
       WHERE package_id = ? AND status IN ('pending', 'confirmed')`,
      [id]
    );

    if (active_count > 0)
      return res.status(400).json({ message: 'Cannot remove a package with active bookings' });

    await db.query(
      `UPDATE TravelPackages SET status_availability = 'inactive' WHERE package_id = ?`,
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
