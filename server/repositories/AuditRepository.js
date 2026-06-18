const { pool } = require('../config/db');
const socketUtil = require('../utils/socket');

class AuditRepository {
  async createLog(actorId, action, entityType, entityId, details, ipAddress) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [actorId, action, entityType, entityId, JSON.stringify(details), ipAddress || null]
      );
      
      const insertId = result.insertId;

      // Fetch the full log details (including actor name) to emit
      const [rows] = await pool.execute(
        `SELECT al.*, e.full_name AS actor_name, e.email AS actor_email, e.employee_number AS actor_employee_number
         FROM audit_logs al
         LEFT JOIN employees e ON al.actor_id = e.id
         WHERE al.id = ?`,
        [insertId]
      );

      if (rows && rows.length > 0) {
        const newLog = rows[0];
        // Emit to Admins
        try {
          socketUtil.getIO().to('Admin').emit('audit_log', newLog);
        } catch (socketErr) {
          console.error('Socket emission failed for audit_log:', socketErr);
        }
      }
    } catch (err) {
      console.error('Failed in createLog:', err);
      throw err;
    }
  }
}

module.exports = new AuditRepository();
