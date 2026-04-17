const pool = require('../db/connection');

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      `SELECT notification_id, message, is_read, created_at
       FROM Notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { notificationId } = req.params;

    const [result] = await pool.query(
      `UPDATE Notifications SET is_read = TRUE
       WHERE notification_id = ? AND user_id = ?`,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    return res.status(200).json({ status: 'success', message: 'Marked as read' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    await pool.query(
      `UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    return res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
  }
};
