const { pool } = require('../config/db');

class ApprovalRepository {
  async getHodPendingRequests(departmentIds) {
    if (!departmentIds || departmentIds.length === 0) return [];
    const placeholders = departmentIds.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.email AS requester_email,
              d.name AS department_name
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       WHERE vr.department_id IN (${placeholders}) AND vr.status = 'Pending_HOD'
       ORDER BY vr.created_at ASC`,
      [...departmentIds]
    );
    return rows;
  }

  async getCooPendingRequests() {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.email AS requester_email,
              d.name AS department_name,
              hod.full_name AS hod_name,
              gmhr.full_name AS gmhr_name
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       LEFT JOIN employees hod ON vr.hod_action_by = hod.id
       LEFT JOIN employees gmhr ON vr.gmhr_action_by = gmhr.id
       WHERE vr.status = 'Pending_COO'
       ORDER BY vr.created_at ASC`
    );
    return rows;
  }

  async getGmHrPendingRequests() {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.email AS requester_email,
              d.name AS department_name,
              hod.full_name AS hod_name
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       LEFT JOIN employees hod ON vr.hod_action_by = hod.id
       WHERE vr.status = 'Pending_GM_HR'
       ORDER BY vr.created_at ASC`
    );
    return rows;
  }

  async updateHodAction(id, newStatus, remarks, actionBy) {
    await pool.execute(
      `UPDATE vehicle_requests
       SET status = ?, hod_remarks = ?, hod_action_by = ?, hod_action_at = NOW()
       WHERE id = ?`,
      [newStatus, remarks || null, actionBy, id]
    );
  }

  async updateCooAction(id, newStatus, remarks, actionBy) {
    await pool.execute(
      `UPDATE vehicle_requests
       SET status = ?, coo_remarks = ?, coo_action_by = ?, coo_action_at = NOW()
       WHERE id = ?`,
      [newStatus, remarks || null, actionBy, id]
    );
  }

  async updateGmHrAction(id, newStatus, remarks, actionBy) {
    await pool.execute(
      `UPDATE vehicle_requests
       SET status = ?, gmhr_remarks = ?, gmhr_action_by = ?, gmhr_action_at = NOW()
       WHERE id = ?`,
      [newStatus, remarks || null, actionBy, id]
    );
  }

  async getHodStats(departmentIds) {
    if (!departmentIds || departmentIds.length === 0) return [];
    const placeholders = departmentIds.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT status, COUNT(*) AS count
       FROM vehicle_requests
       WHERE department_id IN (${placeholders})
       GROUP BY status`,
      [...departmentIds]
    );
    return rows;
  }

  async getGmHrStats() {
    const [rows] = await pool.execute(
      `SELECT status, COUNT(*) AS count
       FROM vehicle_requests
       GROUP BY status`
    );
    return rows;
  }

  async getHodHistory(userId) {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.email AS requester_email,
              d.name AS department_name
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       WHERE vr.hod_action_by = ?
       ORDER BY vr.hod_action_at DESC`,
      [userId]
    );
    return rows;
  }

  async getCooHistory(userId) {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.email AS requester_email,
              d.name AS department_name
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       WHERE vr.coo_action_by = ?
       ORDER BY vr.coo_action_at DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = new ApprovalRepository();
