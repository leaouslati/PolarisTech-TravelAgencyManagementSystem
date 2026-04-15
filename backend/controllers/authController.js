const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/mailer');
const notifyUser = require('../utils/notifyUser');
require('dotenv').config();

// Min 8 chars, 1 uppercase, 1 number, 1 special character
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { full_name, username, email, phone, password } = req.body;

  if (!full_name || !username || !email || !phone || !password) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      status: 'error',
      message: 'Password does not meet requirements'
    });
  }

  try {
    const [[emailRow]] = await pool.query(
      'SELECT user_id FROM Users WHERE email = ?', [email]
    );
    if (emailRow) {
      return res.status(409).json({ status: 'error', message: 'Email already in use' });
    }

    const [[usernameRow]] = await pool.query(
      'SELECT user_id FROM Users WHERE username = ?', [username]
    );
    if (usernameRow) {
      return res.status(409).json({ status: 'error', message: 'Username already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO Users (full_name, username, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, 'Customer', 'Active')`,
      [full_name, username, email, phone, password_hash]
    );
    const user_id = result.insertId;

    await pool.query('INSERT INTO Customers (customer_id) VALUES (?)', [user_id]);

    await pool.query(
      'INSERT INTO PasswordHistory (user_id, password_hash) VALUES (?, ?)',
      [user_id, password_hash]
    );

    await notifyUser(
      user_id,
      `Welcome to PolarisTech, ${full_name}! Your account has been created successfully.`,
      email,
      'Welcome to PolarisTech'
    );

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: { user_id, username, email, role: 'Customer' }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ status: 'error', message: 'Something went wrong' });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password are required' });
  }

  try {
    const [[user]] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.is_locked && user.lock_until && new Date() < new Date(user.lock_until)) {
      return res.status(403).json({
        status: 'error',
        message: 'Account locked. Try again after 15 minutes'
      });
    }

    // If lock period has expired, lift the lock
    if (user.is_locked && user.lock_until && new Date() >= new Date(user.lock_until)) {
      await pool.query(
        'UPDATE Users SET is_locked = FALSE, failed_attempts = 0, lock_until = NULL WHERE user_id = ?',
        [user.user_id]
      );
      user.is_locked = false;
      user.failed_attempts = 0;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      if (newAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await pool.query(
          'UPDATE Users SET failed_attempts = ?, is_locked = TRUE, lock_until = ? WHERE user_id = ?',
          [newAttempts, lockUntil, user.user_id]
        );
      } else {
        await pool.query(
          'UPDATE Users SET failed_attempts = ? WHERE user_id = ?',
          [newAttempts, user.user_id]
        );
      }
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Correct password — reset lock state and record login time
    await pool.query(
      'UPDATE Users SET failed_attempts = 0, is_locked = FALSE, lock_until = NULL, last_login_at = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    // Check password expiry (90 days)
    const ageInDays =
      (Date.now() - new Date(user.password_changed_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 90) {
      return res.status(200).json({
        status: 'password_expired',
        message: 'Your password has expired. Please reset it.'
      });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ status: 'error', message: 'Something went wrong' });
  }
};

// ─── Forgot Password ─────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  // Always respond with success to prevent email enumeration
  const OK = { status: 'success', message: 'If that email is registered, an OTP has been sent.' };

  try {
    const [[user]] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await pool.query(
        'UPDATE Users SET otp_code = ?, otp_expires_at = ? WHERE user_id = ?',
        [otp, otpExpiry, user.user_id]
      );

      await sendEmail(
        email,
        'PolarisTech – Password Reset OTP',
        `<p>Hi ${user.full_name},</p>
         <p>Your one-time password reset code is:</p>
         <h2 style="letter-spacing:4px">${otp}</h2>
         <p>This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
         <p>If you did not request this, please ignore this email.</p>`
      );
    }

    return res.status(200).json(OK);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(200).json(OK);
  }
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ status: 'error', message: 'Email and OTP are required' });
  }

  try {
    const [[user]] = await pool.query(
      'SELECT * FROM Users WHERE email = ? AND otp_code = ?',
      [email, otp.trim()]
    );

    if (!user || !user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
    }

    // Issue a short-lived reset token (15 min) so reset-password is protected
    const reset_token = jwt.sign(
      { user_id: user.user_id, email: user.email, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully',
      data: { reset_token }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ status: 'error', message: 'Something went wrong' });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { reset_token, password } = req.body;

  if (!reset_token || !password) {
    return res.status(400).json({ status: 'error', message: 'Reset token and new password are required' });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ status: 'error', message: 'Password does not meet requirements' });
  }

  let decoded;
  try {
    decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ status: 'error', message: 'Invalid or expired reset token' });
  }

  if (decoded.purpose !== 'password_reset') {
    return res.status(400).json({ status: 'error', message: 'Invalid reset token' });
  }

  try {
    const [history] = await pool.query(
      'SELECT password_hash FROM PasswordHistory WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [decoded.user_id]
    );

    for (const record of history) {
      const reused = await bcrypt.compare(password, record.password_hash);
      if (reused) {
        return res.status(400).json({
          status: 'error',
          message: 'You cannot reuse a recent password'
        });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE Users
       SET password_hash = ?, password_changed_at = NOW(), otp_code = NULL, otp_expires_at = NULL
       WHERE user_id = ?`,
      [password_hash, decoded.user_id]
    );

    await pool.query(
      'INSERT INTO PasswordHistory (user_id, password_hash) VALUES (?, ?)',
      [decoded.user_id, password_hash]
    );

    return res.status(200).json({ status: 'success', message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ status: 'error', message: 'Something went wrong' });
  }
};

module.exports = { register, login, forgotPassword, verifyOtp, resetPassword };
