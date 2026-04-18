const db = require('../db/connection');
const { notifyUser } = require('../utils/notifyUser');

// ─────────────────────────────────────────────
// Route 1 — GET cancellations
// ─────────────────────────────────────────────
exports.getCancellationRequests = async (req, res) => {
  try {
    const agentId = req.user.user_id;

    const [rows] = await db.query(`
      SELECT
        cr.cancel_id,
        cr.booking_id,
        u.name AS customer_name,
        tp.name AS package_name,
        cr.reason,
        cr.status,
        cr.created_at
      FROM CancellationRequests cr
      JOIN Bookings b ON b.booking_id = cr.booking_id
      JOIN Users u ON u.user_id = b.user_id
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
// Route 2 — APPROVE cancellation
// ─────────────────────────────────────────────
exports.approveCancellation = async (req, res) => {
  const { cancelId } = req.params;

  try {
    // get cancellation
    const [rows] = await db.query(
      'SELECT * FROM CancellationRequests WHERE cancel_id = ?',
      [cancelId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Not found' });

    const cancellation = rows[0];

    // update cancellation
    await db.query(
      'UPDATE CancellationRequests SET status = "approved" WHERE cancel_id = ?',
      [cancelId]
    );

    // update booking
    await db.query(
      'UPDATE Bookings SET status = "cancelled" WHERE booking_id = ?',
      [cancellation.booking_id]
    );

    // increase slots
    await db.query(
      'UPDATE TravelPackages SET available_slots = available_slots + 1 WHERE package_id = (SELECT package_id FROM Bookings WHERE booking_id = ?)',
      [cancellation.booking_id]
    );

    // notify
    const bookingCode = `BK-${String(cancellation.booking_id).padStart(4, '0')}`;

    await notifyUser(
      cancellation.user_id,
      `Your cancellation request for booking ${bookingCode} has been approved.`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 3 — REJECT cancellation
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

    await db.query(
      'UPDATE CancellationRequests SET status = "rejected" WHERE cancel_id = ?',
      [cancelId]
    );

    const bookingCode = `BK-${String(cancellation.booking_id).padStart(4, '0')}`;

    await notifyUser(
      cancellation.user_id,
      `Your cancellation request for booking ${bookingCode} has been rejected.`
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 4 — SEND message
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  const { bookingId } = req.params;
  const { content } = req.body;
  const senderId = req.user.user_id;

  try {
    if (!content) return res.status(400).json({ message: 'Content required' });

    await db.query(
      'INSERT INTO Messages (booking_id, sender_id, content) VALUES (?, ?, ?)',
      [bookingId, senderId, content]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// Route 5 — GET messages
// ─────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT
        m.message_id,
        u.name AS sender_name,
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
// Route 6 — GET notifications
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