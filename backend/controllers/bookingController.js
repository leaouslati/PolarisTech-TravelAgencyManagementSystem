// Booking and payment logic
const db = require('../db/connection');
const notifyUser = require('../utils/notifyUser');

// GET /bookings/:bookingId/messages
exports.getMessages = async (req, res) => {
  const { bookingId } = req.params;
  const customerId = req.user.user_id;
  try {
    const [booking] = await db.query(
      'SELECT booking_id FROM Bookings WHERE booking_id = ? AND customer_id = ?',
      [bookingId, customerId]
    );
    if (!booking.length)
      return res.status(403).json({ status: 'error', message: 'Not authorized' });

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

// POST /bookings/:bookingId/messages
exports.sendMessage = async (req, res) => {
  const { bookingId } = req.params;
  const { content } = req.body;
  const customerId = req.user.user_id;
  try {
    if (!content || !content.trim())
      return res.status(400).json({ status: 'error', message: 'Content required' });

    const [booking] = await db.query(
      'SELECT booking_id FROM Bookings WHERE booking_id = ? AND customer_id = ?',
      [bookingId, customerId]
    );
    if (!booking.length)
      return res.status(403).json({ status: 'error', message: 'Not authorized' });

    const [result] = await db.query(
      'INSERT INTO Messages (booking_id, sender_id, content) VALUES (?, ?, ?)',
      [bookingId, customerId, content.trim()]
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

const createBookingCode = async () => {
  const year = new Date().getFullYear();
  const [rows] = await db.execute(`SELECT COUNT(*) AS total FROM Bookings`);
  const nextNumber = String(rows[0].total + 1).padStart(4, '0');
  return `BK-${year}-${nextNumber}`;
};

const createTransactionCode = async () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const [rows] = await db.execute(`SELECT COUNT(*) AS total FROM Payments`);
  const nextNumber = String(rows[0].total + 1).padStart(4, '0');
  return `TXN-${yyyy}${mm}${dd}-${nextNumber}`;
};

exports.createBooking = async (req, res) => {
  let connection;

  try {
    const userId = req.user.user_id;
    const { package_id, travel_date, num_travelers, addon_ids = [] } = req.body;

    if (!package_id || !travel_date || !num_travelers) {
      return res.status(400).json({
        status: 'error',
        message: 'package_id, travel_date and num_travelers are required',
        data: null,
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Lock the package row to prevent race conditions
    const [packageRows] = await connection.execute(
      `SELECT * FROM TravelPackages WHERE package_id = ? FOR UPDATE`,
      [package_id]
    );

    if (packageRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Package not found',
        data: null,
      });
    }

    const selectedPackage = packageRows[0];

    if (selectedPackage.available_slots <= 0) {
      await connection.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Sorry, this package is fully booked',
        data: null,
      });
    }

    let addonsTotal = 0;

    if (addon_ids.length > 0) {
      const placeholders = addon_ids.map(() => '?').join(',');
      const [addonRows] = await connection.execute(
        `SELECT addon_id, price FROM AddOns WHERE addon_id IN (${placeholders})`,
        addon_ids
      );
      addonsTotal = addonRows.reduce((sum, addon) => sum + Number(addon.price), 0);
    }

    const booking_id = await createBookingCode();
    const total_price =
      Number(selectedPackage.total_price) * Number(num_travelers) + addonsTotal;

    await connection.execute(
      `INSERT INTO Bookings
        (booking_id, customer_id, package_id, staff_id, travel_date, num_travelers, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        booking_id,
        userId,
        package_id,
        selectedPackage.staff_id,
        travel_date,
        num_travelers,
        total_price,
      ]
    );

    if (addon_ids.length > 0) {
      for (const addonId of addon_ids) {
        await connection.execute(
          `INSERT INTO BookingAddOns (booking_id, addon_id) VALUES (?, ?)`,
          [booking_id, addonId]
        );
      }
    }

    await connection.execute(
      `UPDATE TravelPackages
       SET available_slots = available_slots - 1
       WHERE package_id = ?`,
      [package_id]
    );

    await connection.commit();

    try {
      await notifyUser(
        userId,
        `Your booking ${booking_id} has been submitted and is pending agent approval`
      );

      await notifyUser(
        selectedPackage.staff_id,
        `New booking request ${booking_id} from ${req.user.username} for package "${selectedPackage.package_name}"`
      );
    } catch (notifyError) {
      console.error('notify error:', notifyError);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Booking created',
      data: { booking_id, status: 'pending', total_price },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('createBooking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create booking',
      data: null,
    });
  } finally {
    if (connection) connection.release();
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [rows] = await db.execute(
      `SELECT
        b.booking_id,
        tp.package_name,
        d.city AS destination_city,
        b.travel_date,
        b.num_travelers,
        b.status,
        b.total_price,
        b.booking_date AS created_at
      FROM Bookings b
      JOIN TravelPackages tp ON b.package_id = tp.package_id
      JOIN Destinations d ON tp.destination_id = d.destination_id
      WHERE b.customer_id = ?
      ORDER BY b.booking_date DESC`,
      [userId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Bookings fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error('getMyBookings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings',
      data: null,
    });
  }
};

exports.getOneBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const [bookingRows] = await db.execute(
      `SELECT
        b.*,
        tp.package_name,
        tp.description,
        tp.total_price AS package_price,
        tp.staff_id,
        d.city,
        d.country
      FROM Bookings b
      JOIN TravelPackages tp ON b.package_id = tp.package_id
      JOIN Destinations d ON tp.destination_id = d.destination_id
      WHERE b.booking_id = ?`,
      [id]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
        data: null,
      });
    }

    const booking = bookingRows[0];

    const isOwner = booking.customer_id === user.user_id;
    const isAgentOrAdmin =
      user.role === 'TravelAgent' || user.role === 'Administrator';

    if (!isOwner && !isAgentOrAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        data: null,
      });
    }

    const [addons] = await db.execute(
      `SELECT a.addon_id, a.name, a.price
       FROM BookingAddOns ba
       JOIN AddOns a ON ba.addon_id = a.addon_id
       WHERE ba.booking_id = ?`,
      [id]
    );

    const [payments] = await db.execute(
      `SELECT *
       FROM Payments
       WHERE booking_id = ?`,
      [id]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Booking fetched successfully',
      data: {
        ...booking,
        addons,
        payment_status: payments.length > 0 ? payments[0].payment_status : 'unpaid',
        payments,
      },
    });
  } catch (error) {
    console.error('getOneBooking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking',
      data: null,
    });
  }
};

exports.attachAddons = async (req, res) => {
  try {
    const { id } = req.params;
    const { addon_ids } = req.body;

    if (!addon_ids || !Array.isArray(addon_ids) || addon_ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'addon_ids array is required',
        data: null,
      });
    }

    for (const addonId of addon_ids) {
      await db.execute(
        `INSERT INTO BookingAddOns (booking_id, addon_id) VALUES (?, ?)`,
        [id, addonId]
      );
    }

    return res.status(200).json({
      status: 'success',
      message: 'Add-ons attached successfully',
      data: { booking_id: id, addon_ids },
    });
  } catch (error) {
    console.error('attachAddons error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to attach add-ons',
      data: null,
    });
  }
};

exports.modifyBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { travel_date, num_travelers } = req.body;
    const userId = req.user.user_id;

    const [bookingRows] = await db.execute(
      `SELECT b.*, tp.total_price AS package_price
       FROM Bookings b
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
        data: null,
      });
    }

    const booking = bookingRows[0];

    if (booking.customer_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        data: null,
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot modify a cancelled booking',
        data: null,
      });
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending or confirmed bookings can be modified',
        data: null,
      });
    }

    const updatedTravelDate = travel_date || booking.travel_date;
    const updatedTravelers = num_travelers || booking.num_travelers;

    if (travel_date) {
      const today = new Date();
      const newDate = new Date(travel_date);

      if (newDate <= today) {
        return res.status(400).json({
          status: 'error',
          message: 'Travel date must be in the future',
          data: null,
        });
      }
    }

    const [addonRows] = await db.execute(
      `SELECT COALESCE(SUM(a.price), 0) AS addons_total
       FROM BookingAddOns ba
       JOIN AddOns a ON ba.addon_id = a.addon_id
       WHERE ba.booking_id = ?`,
      [bookingId]
    );

    const addonsTotal = Number(addonRows[0].addons_total || 0);
    const newTotalPrice =
      Number(booking.package_price) * Number(updatedTravelers) + addonsTotal;

    await db.execute(
      `UPDATE Bookings
       SET travel_date = ?, num_travelers = ?, total_price = ?
       WHERE booking_id = ?`,
      [updatedTravelDate, updatedTravelers, newTotalPrice, bookingId]
    );

    try {
      await notifyUser(userId, `Your booking ${bookingId} has been updated`);
    } catch (notifyError) {
      console.error('notify error:', notifyError);
    }

    const [updatedRows] = await db.execute(
      `SELECT * FROM Bookings WHERE booking_id = ?`,
      [bookingId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Booking updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    console.error('modifyBooking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update booking',
      data: null,
    });
  }
};

exports.submitCancellation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.user_id;

    const [bookingRows] = await db.execute(
      `SELECT b.*, u.full_name, tp.staff_id
       FROM Bookings b
       JOIN Users u ON b.customer_id = u.user_id
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
        data: null,
      });
    }

    const booking = bookingRows[0];

    if (booking.customer_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied',
        data: null,
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'This booking is already cancelled',
        data: null,
      });
    }

    const now = new Date();
    const travelDate = new Date(booking.travel_date);
    const diffHours = (travelDate - now) / (1000 * 60 * 60);

    if (diffHours <= 24) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel a booking within 24 hours of travel date',
        data: null,
      });
    }

    const [existingRows] = await db.execute(
      `SELECT * FROM CancellationRequests WHERE booking_id = ? AND status = 'pending'`,
      [bookingId]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'A cancellation request is already pending for this booking',
        data: null,
      });
    }

    await db.execute(
      `INSERT INTO CancellationRequests (booking_id, user_id, reason, status)
       VALUES (?, ?, ?, 'pending')`,
      [bookingId, userId, reason || null]
    );

    try {
      await notifyUser(
        booking.staff_id,
        `Customer ${booking.full_name} has submitted a cancellation request for booking ${bookingId}`
      );
    } catch (notifyError) {
      console.error('notify error:', notifyError);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Cancellation request submitted. The agent will review it shortly',
      data: { booking_id: bookingId },
    });
  } catch (error) {
    console.error('submitCancellation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit cancellation request',
      data: null,
    });
  }
};

exports.processPaymentFromBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { card_number, expiry_date, cvv } = req.body;

    if (!card_number || !expiry_date || !cvv) {
      return res.status(400).json({
        status: 'error',
        message: 'card_number, expiry_date and cvv are required',
        data: null,
      });
    }

    const cleanCard = card_number.replace(/\s/g, '');

    if (!/^\d{16}$/.test(cleanCard)) {
      return res.status(400).json({
        status: 'error',
        message: 'Card number must be 16 digits',
        data: null,
      });
    }

    const [bookingRows] = await db.execute(
      `SELECT b.*, tp.staff_id
       FROM Bookings b
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
        data: null,
      });
    }

    const booking = bookingRows[0];
    const transaction_id = await createTransactionCode();

    if (cleanCard.startsWith('4')) {
      await db.execute(
        `INSERT INTO Payments
        (booking_id, transaction_id, amount, payment_method, payment_status)
        VALUES (?, ?, ?, 'Card', 'paid')`,
        [bookingId, transaction_id, booking.total_price]
      );

      await db.execute(
        `UPDATE Bookings SET status = 'confirmed' WHERE booking_id = ?`,
        [bookingId]
      );

      try {
        await notifyUser(
          booking.customer_id,
          `Payment successful! Transaction ID: ${transaction_id}. Your booking ${bookingId} is confirmed`
        );

        await notifyUser(
          booking.staff_id,
          `Booking ${bookingId} payment has been completed`
        );
      } catch (notifyError) {
        console.error('notify error:', notifyError);
      }

      return res.status(200).json({
        status: 'success',
        message: 'Payment successful! Your booking is confirmed',
        data: { transaction_id, booking_status: 'confirmed' },
      });
    }

    await db.execute(
      `INSERT INTO Payments
      (booking_id, transaction_id, amount, payment_method, payment_status)
      VALUES (?, ?, ?, 'Card', 'failed')`,
      [bookingId, transaction_id, booking.total_price]
    );

    return res.status(400).json({
      status: 'error',
      message: 'Payment failed. Please check your card details and try again',
      data: null,
    });
  } catch (error) {
    console.error('processPaymentFromBooking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process payment',
      data: null,
    });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { booking_id, card_number, expiry_date, cvv } = req.body;

    if (!booking_id || !card_number || !expiry_date || !cvv) {
      return res.status(400).json({
        status: 'error',
        message: 'booking_id, card_number, expiry_date and cvv are required',
        data: null,
      });
    }

    if (!/^\d{16}$/.test(card_number)) {
      return res.status(400).json({
        status: 'error',
        message: 'Card number must be 16 digits',
        data: null,
      });
    }

    const [bookingRows] = await db.execute(
      `SELECT b.*, tp.staff_id
       FROM Bookings b
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       WHERE b.booking_id = ?`,
      [booking_id]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
        data: null,
      });
    }

    const booking = bookingRows[0];
    const transaction_id = await createTransactionCode();

    if (card_number.startsWith('4')) {
      await db.execute(
        `INSERT INTO Payments
        (booking_id, transaction_id, amount, payment_method, payment_status)
         VALUES (?, ?, ?, 'Card', 'paid')`,
        [booking_id, transaction_id, booking.total_price]
      );

      await db.execute(
        `UPDATE Bookings SET status = 'confirmed' WHERE booking_id = ?`,
        [booking_id]
      );

      try {
        await notifyUser(
          booking.customer_id,
          `Payment successful! Transaction ID: ${transaction_id}. Your booking ${booking_id} is confirmed`
        );

        await notifyUser(
          booking.staff_id,
          `Booking ${booking_id} payment has been completed`
        );
      } catch (notifyError) {
        console.error('notify error:', notifyError);
      }

      return res.status(200).json({
        status: 'success',
        message: 'Payment processed successfully',
        data: { transaction_id, booking_status: 'confirmed' },
      });
    }

    await db.execute(
      `INSERT INTO Payments
       (booking_id, transaction_id, amount, payment_method, payment_status)
       VALUES (?, ?, ?, 'Card', 'failed')`,
      [booking_id, transaction_id, booking.total_price]
    );

    return res.status(400).json({
      status: 'error',
      message: 'Payment failed. Please check your card details and try again',
      data: null,
    });
  } catch (error) {
    console.error('processPayment error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process payment',
      data: null,
    });
  }
};