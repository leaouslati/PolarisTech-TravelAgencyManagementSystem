const pool = require('../db/connection');
const sendEmail = require('./mailer');

const notifyUser = async (userId, message, email = null, subject = null) => {
  try {
    await pool.query(
      'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
      [userId, message]
    );
    if (email && subject) {
      await sendEmail(email, subject, `<p>${message}</p>`);
    }
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = notifyUser;