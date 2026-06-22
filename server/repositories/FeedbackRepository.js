const { pool } = require('../config/db');

class FeedbackRepository {
  async createFeedback(requestId, driverId, requesterId, rating, comments) {
    const [result] = await pool.execute(
      `INSERT INTO driver_feedback (request_id, driver_id, requester_id, rating, comments)
       VALUES (?, ?, ?, ?, ?)`,
      [requestId, driverId, requesterId, rating, comments]
    );
    return result.insertId;
  }

  async getFeedbackByRequestId(requestId) {
    const [rows] = await pool.execute(
      `SELECT df.*, e.full_name AS requester_name, d.full_name AS driver_name
       FROM driver_feedback df
       JOIN employees e ON df.requester_id = e.id
       JOIN drivers d ON df.driver_id = d.id
       WHERE df.request_id = ?`,
      [requestId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getAllFeedbacks() {
    const [rows] = await pool.execute(
      `SELECT df.*, 
              e.full_name AS requester_name,
              dept.name AS department_name,
              d.full_name AS driver_name,
              vr.destination,
              vr.travel_date
       FROM driver_feedback df
       JOIN employees e ON df.requester_id = e.id
       JOIN vehicle_requests vr ON df.request_id = vr.id
       LEFT JOIN departments dept ON vr.department_id = dept.id
       JOIN drivers d ON df.driver_id = d.id
       ORDER BY df.created_at DESC`
    );
    return rows;
  }
}

module.exports = new FeedbackRepository();
