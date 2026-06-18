const { pool } = require('../config/db');

class NotificationRepository {
  async createNotification(userId, title, message, type) {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, title, message, type]
    );
    return result.insertId;
  }

  async getMyNotifications(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return rows;
  }

  async markAsRead(id, userId) {
    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  }

  async markAllAsRead(userId) {
    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [userId]
    );
  }
}

module.exports = new NotificationRepository();
