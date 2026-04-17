const pool = require('../db/connection');

const notifyUser = async (userId, message, conn = null) => {
  const executor = conn || pool;
  await executor.query(
    'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
    [userId, message]
  );
};

/* ======================================================
   DAY 1 - USERS
====================================================== */

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;

    let sql = `
      SELECT
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.created_at,
        COUNT(
          CASE
            WHEN b.status IN ('pending', 'confirmed') THEN 1
            ELSE NULL
          END
        ) AS active_booking_count
      FROM Users u
      LEFT JOIN Bookings b ON u.user_id = b.customer_id
    `;

    const conditions = [];
    const params = [];

    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }

    if (status) {
      conditions.push('u.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += `
      GROUP BY
        u.user_id, u.username, u.full_name, u.email, u.phone, u.role, u.status, u.created_at
      ORDER BY u.created_at DESC
    `;

    const [rows] = await pool.query(sql, params);

    return res.status(200).json({
      status: 'success',
      message: 'Users fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      data: null,
    });
  }
};

// GET /api/admin/users/:userId
exports.getOneUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        u.user_id,
        u.username,
        u.full_name,
        u.gender,
        u.date_of_birth,
        u.email,
        u.phone,
        u.address,
        u.role,
        u.status,
        u.last_login_at,
        u.is_locked,
        u.failed_attempts,
        u.lock_until,
        u.password_changed_at,
        u.created_at,
        COUNT(b.booking_id) AS total_booking_count
      FROM Users u
      LEFT JOIN Bookings b ON u.user_id = b.customer_id
      WHERE u.user_id = ?
      GROUP BY
        u.user_id, u.username, u.full_name, u.gender, u.date_of_birth,
        u.email, u.phone, u.address, u.role, u.status, u.last_login_at,
        u.is_locked, u.failed_attempts, u.lock_until, u.password_changed_at, u.created_at
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        data: null,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'User fetched successfully',
      data: rows[0],
    });
  } catch (error) {
    console.error('getOneUser error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user',
      data: null,
    });
  }
};

// PUT /api/admin/users/:userId
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, status } = req.body;

    const allowedRoles = ['Customer', 'TravelAgent', 'Administrator'];
    const allowedStatuses = ['Active', 'Suspended'];

    if (!role && !status) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one field is required: role or status',
        data: null,
      });
    }

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role value',
        data: null,
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value',
        data: null,
      });
    }

    const [existingRows] = await pool.query(
      'SELECT user_id FROM Users WHERE user_id = ?',
      [userId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        data: null,
      });
    }

    const updates = [];
    const params = [];

    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    params.push(userId);

    await pool.query(
      `UPDATE Users SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    const [updatedRows] = await pool.query(
      `
      SELECT
        user_id, username, full_name, email, phone, role, status, created_at
      FROM Users
      WHERE user_id = ?
      `,
      [userId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user',
      data: null,
    });
  }
};

// DELETE /api/admin/users/:userId
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const [userRows] = await pool.query(
      'SELECT user_id, full_name, status FROM Users WHERE user_id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        data: null,
      });
    }

    const [bookingRows] = await pool.query(
      `
      SELECT COUNT(*) AS active_booking_count
      FROM Bookings
      WHERE customer_id = ?
        AND status IN ('pending', 'confirmed')
      `,
      [userId]
    );

    if (bookingRows[0].active_booking_count > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete a user with active bookings',
        data: null,
      });
    }

    await pool.query(
      `UPDATE Users SET status = 'Deleted' WHERE user_id = ?`,
      [userId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'User account deactivated',
      data: { user_id: Number(userId), status: 'Deleted' },
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate user',
      data: null,
    });
  }
};

/* ======================================================
   DAY 2 - MONITORING / REPORTS / PACKAGE UPDATES
====================================================== */

// GET /api/admin/bookings?status=pending
exports.getAllBookings = async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT
        b.booking_id,
        u.full_name AS customer_name,
        tp.package_name,
        CONCAT(d.city, ', ', d.country) AS destination,
        b.travel_date,
        b.num_travelers,
        b.status,
        b.total_price,
        b.booking_date AS created_at
      FROM Bookings b
      INNER JOIN Users u ON b.customer_id = u.user_id
      INNER JOIN TravelPackages tp ON b.package_id = tp.package_id
      INNER JOIN Destinations d ON tp.destination_id = d.destination_id
    `;

    const params = [];

    if (status) {
      sql += ` WHERE b.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY b.booking_date DESC`;

    const [rows] = await pool.query(sql, params);

    return res.status(200).json({
      status: 'success',
      message: 'Bookings fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error('getAllBookings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings',
      data: null,
    });
  }
};

// GET /api/admin/packages
exports.getAllPackages = async (req, res) => {
  try {
    const sql = `
      SELECT
        tp.package_id,
        tp.package_name,
        u.full_name AS agent_name,
        CONCAT(d.city, ', ', d.country) AS destination,
        tp.total_price,
        tp.available_slots,
        tp.status_availability,
        tp.travel_date,
        tp.return_date,
        tp.duration,
        tp.description,
        tp.created_at
      FROM TravelPackages tp
      INNER JOIN Users u ON tp.staff_id = u.user_id
      INNER JOIN Destinations d ON tp.destination_id = d.destination_id
      ORDER BY tp.created_at DESC
    `;

    const [rows] = await pool.query(sql);

    return res.status(200).json({
      status: 'success',
      message: 'Packages fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error('getAllPackages error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch packages',
      data: null,
    });
  }
};

// GET /api/admin/reports/revenue?startDate=2026-01-01&endDate=2026-12-31
exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'startDate and endDate are required',
        data: null,
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date range. Start date cannot be after end date',
        data: null,
      });
    }

    const [summaryRows] = await pool.query(
      `
      SELECT
        COUNT(DISTINCT b.booking_id) AS total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.booking_id END) AS confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.booking_id END) AS cancelled_bookings,
        COALESCE(SUM(p.amount), 0) AS total_revenue
      FROM Payments p
      INNER JOIN Bookings b ON p.booking_id = b.booking_id
      WHERE p.payment_status = 'paid'
        AND DATE(p.payment_date) BETWEEN ? AND ?
      `,
      [startDate, endDate]
    );

    const [breakdownRows] = await pool.query(
      `
      SELECT
        tp.package_id,
        tp.package_name,
        COUNT(DISTINCT b.booking_id) AS booking_count,
        COALESCE(SUM(p.amount), 0) AS revenue
      FROM Payments p
      INNER JOIN Bookings b ON p.booking_id = b.booking_id
      INNER JOIN TravelPackages tp ON b.package_id = tp.package_id
      WHERE p.payment_status = 'paid'
        AND DATE(p.payment_date) BETWEEN ? AND ?
      GROUP BY tp.package_id, tp.package_name
      ORDER BY revenue DESC, booking_count DESC
      `,
      [startDate, endDate]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Revenue report generated successfully',
      data: {
        startDate,
        endDate,
        total_bookings: Number(summaryRows[0].total_bookings) || 0,
        confirmed_bookings: Number(summaryRows[0].confirmed_bookings) || 0,
        cancelled_bookings: Number(summaryRows[0].cancelled_bookings) || 0,
        total_revenue: Number(summaryRows[0].total_revenue) || 0,
        breakdown: breakdownRows,
      },
    });
  } catch (error) {
    console.error('getRevenueReport error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate revenue report',
      data: null,
    });
  }
};

// GET /api/admin/package-updates
exports.getPendingPackageUpdates = async (req, res) => {
  try {
    const sql = `
      SELECT
        pur.update_id,
        tp.package_name,
        u.full_name AS agent_name,
        pur.updated_data,
        pur.created_at
      FROM PackageUpdateRequests pur
      INNER JOIN TravelPackages tp ON pur.package_id = tp.package_id
      INNER JOIN Users u ON pur.agent_id = u.user_id
      WHERE pur.status = 'pending'
      ORDER BY pur.created_at DESC
    `;

    const [rows] = await pool.query(sql);

    return res.status(200).json({
      status: 'success',
      message: 'Pending package updates fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error('getPendingPackageUpdates error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending package updates',
      data: null,
    });
  }
};

// PATCH /api/admin/package-updates/:updateId/approve
exports.approvePackageUpdate = async (req, res) => {
  let conn;
  try {
    const { updateId } = req.params;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [updateRows] = await conn.query(
      `
      SELECT
        pur.update_id,
        pur.package_id,
        pur.agent_id,
        pur.updated_data,
        pur.status,
        tp.package_name
      FROM PackageUpdateRequests pur
      INNER JOIN TravelPackages tp ON pur.package_id = tp.package_id
      WHERE pur.update_id = ?
      FOR UPDATE
      `,
      [updateId]
    );

    if (updateRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Package update request not found',
        data: null,
      });
    }

    const updateRequest = updateRows[0];

    if (updateRequest.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'This update has already been reviewed',
        data: null,
      });
    }

    let updatedData = updateRequest.updated_data;
    if (typeof updatedData === 'string') {
      updatedData = JSON.parse(updatedData);
    }

    const allowedFields = [
      'package_name',
      'destination_id',
      'staff_id',
      'total_price',
      'travel_date',
      'return_date',
      'duration',
      'description',
      'status_availability',
      'available_slots',
    ];

    const fields = [];
    const values = [];

    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updatedData, key)) {
        fields.push(`${key} = ?`);
        values.push(updatedData[key]);
      }
    }

    // Set package back to active after review
    fields.push('status_availability = ?');
    values.push('active');

    values.push(updateRequest.package_id);

    await conn.query(
      `UPDATE TravelPackages SET ${fields.join(', ')} WHERE package_id = ?`,
      values
    );

    await conn.query(
      `UPDATE PackageUpdateRequests SET status = 'approved' WHERE update_id = ?`,
      [updateId]
    );

    await notifyUser(
      updateRequest.agent_id,
      `Your package update for ${updateRequest.package_name} has been approved`,
      conn
    );

    await conn.commit();

    return res.status(200).json({
      status: 'success',
      message: 'Package update approved successfully',
      data: null,
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('approvePackageUpdate error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to approve package update',
      data: null,
    });
  } finally {
    if (conn) conn.release();
  }
};

// PATCH /api/admin/package-updates/:updateId/reject
exports.rejectPackageUpdate = async (req, res) => {
  let conn;
  try {
    const { updateId } = req.params;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [updateRows] = await conn.query(
      `
      SELECT
        pur.update_id,
        pur.package_id,
        pur.agent_id,
        pur.status,
        tp.package_name
      FROM PackageUpdateRequests pur
      INNER JOIN TravelPackages tp ON pur.package_id = tp.package_id
      WHERE pur.update_id = ?
      FOR UPDATE
      `,
      [updateId]
    );

    if (updateRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Package update request not found',
        data: null,
      });
    }

    const updateRequest = updateRows[0];

    if (updateRequest.status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'This update has already been reviewed',
        data: null,
      });
    }

    await conn.query(
      `UPDATE PackageUpdateRequests SET status = 'rejected' WHERE update_id = ?`,
      [updateId]
    );

    await conn.query(
      `UPDATE TravelPackages SET status_availability = 'active' WHERE package_id = ?`,
      [updateRequest.package_id]
    );

    await notifyUser(
      updateRequest.agent_id,
      `Your package update for ${updateRequest.package_name} has been rejected. The original information has been kept`,
      conn
    );

    await conn.commit();

    return res.status(200).json({
      status: 'success',
      message: 'Package update rejected successfully',
      data: null,
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('rejectPackageUpdate error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reject package update',
      data: null,
    });
  } finally {
    if (conn) conn.release();
  }
};