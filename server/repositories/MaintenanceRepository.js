const { pool } = require('../config/db');

class MaintenanceRepository {
  async findAll() {
    const [rows] = await pool.execute(`
      SELECT m.*, v.registration_no, v.make, v.model, e.full_name as creator_name
      FROM vehicle_maintenance m
      JOIN vehicles v ON m.vehicle_id = v.id
      LEFT JOIN employees e ON m.created_by = e.id
      ORDER BY m.scheduled_date DESC
    `);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM vehicle_maintenance WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO vehicle_maintenance (vehicle_id, scheduled_date, description, status, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [data.vehicle_id, data.scheduled_date, data.description, data.status || 'Scheduled', data.created_by]
    );
    return result.insertId;
  }

  async updateStatus(id, status) {
    await pool.execute('UPDATE vehicle_maintenance SET status = ? WHERE id = ?', [status, id]);
  }

  async addRecord(data) {
    const [result] = await pool.execute(
      `INSERT INTO maintenance_records (maintenance_id, vehicle_id, maintenance_date, cost, description, vendor, invoice_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.maintenance_id || null, data.vehicle_id, data.maintenance_date, data.cost, data.description, data.vendor || null, data.invoice_url || null]
    );
    return result.insertId;
  }

  async findExpiringCertificates(days = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);
    const [rows] = await pool.execute(
      `SELECT id, registration_no, make, model, insurance_expiry, fitness_expiry, pollution_expiry 
       FROM vehicles 
       WHERE (insurance_expiry IS NOT NULL AND insurance_expiry <= ?)
          OR (fitness_expiry IS NOT NULL AND fitness_expiry <= ?)
          OR (pollution_expiry IS NOT NULL AND pollution_expiry <= ?)`
    , [thresholdDate, thresholdDate, thresholdDate]);
    return rows;
  }

  async releaseVehicle(vehicleId) {
    await pool.execute('UPDATE vehicles SET is_available = 1 WHERE id = ?', [vehicleId]);
  }
}

module.exports = new MaintenanceRepository();

