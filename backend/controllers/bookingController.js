const db = require('../db/connection');

const createBookingCode = async () => {
  const year = new Date().getFullYear();

  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total FROM Bookings`
  );

  const nextNumber = String(rows[0].total + 1).padStart(4, '0');
  return `BK-${year}-${nextNumber}`;
};

const createTransactionCode = async () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total FROM Payments`
  );

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
        data: null
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [packageRows] = await connection.execute(
      `SELECT * FROM TravelPackages WHERE package_id = ? FOR UPDATE`,
      [package_id]
    );

    if (packageRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Package not found',
        data: null
      });
    }

    const selectedPackage = packageRows[0];

    if (selectedPackage.available_slots <= 0) {
      await connection.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Sorry, this package is fully booked',
        data: null
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
      (booking_id, customer_id, package_id, travel_date, num_travelers, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [booking_id, userId, package_id, travel_date, num_travelers, total_price]
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

    return res.status(201).json({
      status: 'success',
      message: 'Booking created',
      data: {
        booking_id,
        status: 'pending',
        total_price
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('createBooking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create booking',
      data: null
    });
  } finally {
    if (connection) {
      connection.release();
    }
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
        b.total_price
      FROM Bookings b
      JOIN TravelPackages tp ON b.package_id = tp.package_id
      JOIN Destinations d ON tp.destination_id = d.destination_id
      WHERE b.customer_id = ?
      ORDER BY b.booking_id DESC`,
      [userId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Bookings fetched successfully',
      data: rows
    });
  } catch (error) {
    console.error('getMyBookings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings',
      data: null
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
        data: null
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
        data: null
      });
    }

    const [addons] = await db.execute(
      `SELECT a.addon_id, a.addon_name, a.price
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
        payments
      }
    });
  } catch (error) {
    console.error('getOneBooking error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking',
      data: null
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
        data: null
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
      data: {
        booking_id: id,
        addon_ids
      }
    });
  } catch (error) {
    console.error('attachAddons error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to attach add-ons',
      data: null
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
        data: null
      });
    }

    if (!/^\d{16}$/.test(card_number)) {
      return res.status(400).json({
        status: 'error',
        message: 'Card number must be 16 digits',
        data: null
      });
    }

    const [bookingRows] = await db.execute(
      `SELECT * FROM Bookings WHERE booking_id = ?`,
      [booking_id]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
        data: null
      });
    }

    const booking = bookingRows[0];
    const transaction_id = await createTransactionCode();

    if (card_number.startsWith('4')) {
      await db.execute(
        `INSERT INTO Payments
        (booking_id, transaction_id, amount, payment_status)
        VALUES (?, ?, ?, 'paid')`,
        [booking_id, transaction_id, booking.total_price]
      );

      await db.execute(
        `UPDATE Bookings SET status = 'confirmed' WHERE booking_id = ?`,
        [booking_id]
      );

      return res.status(200).json({
        status: 'success',
        message: 'Payment processed successfully',
        data: {
          transaction_id,
          booking_status: 'confirmed'
        }
      });
    }

    await db.execute(
      `INSERT INTO Payments
      (booking_id, transaction_id, amount, payment_status)
      VALUES (?, ?, ?, 'failed')`,
      [booking_id, transaction_id, booking.total_price]
    );

    return res.status(400).json({
      status: 'error',
      message: 'Payment failed. Please check your card details and try again',
      data: null
    });
  } catch (error) {
    console.error('processPayment error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process payment',
      data: null
    });
  }
};