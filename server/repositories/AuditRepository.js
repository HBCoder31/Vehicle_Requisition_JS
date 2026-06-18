const { pool } = require('../config/db');

class AuditRepository {
  async createLog(actorId, action, entityType, entityId, details, ipAddress) {
    await pool.execute(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [actorId, action, entityType, entityId, JSON.stringify(details), ipAddress || null]
    );
  }
}

module.exports = new AuditRepository();
