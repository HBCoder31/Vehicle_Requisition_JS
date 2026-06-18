const { pool } = require('../config/db');

class HistoryRepository {
  async addEvent(requestId, actionBy, actionType, statusFrom, statusTo, comments) {
    await pool.execute(
      `INSERT INTO request_history (request_id, changed_by, action_type, status_from, status_to, comments)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [requestId, actionBy, actionType || null, statusFrom || null, statusTo || null, comments || null]
    );
  }

  async getHistoryForRequest(requestId) {
    const [rows] = await pool.execute(
      `SELECT h.*, e.full_name as actor_name, e.role as actor_role
       FROM request_history h
       JOIN employees e ON h.changed_by = e.id
       WHERE h.request_id = ?
       ORDER BY h.changed_at ASC`,
      [requestId]
    );
    return rows;
  }
}

module.exports = new HistoryRepository();
