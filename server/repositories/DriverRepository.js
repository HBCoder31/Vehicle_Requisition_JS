const { pool } = require('../config/db');

class DriverRepository {
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE is_deleted = 0 ORDER BY full_name ASC');
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE id = ? AND is_deleted = 0', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO drivers (full_name, employee_number, email, phone, license_number, license_expiry, campus_id, is_active, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [data.full_name, data.employee_number, data.email, data.phone, data.license_number, data.license_expiry || null, data.campus_id || null, data.is_active ?? 1]
    );
    return result.insertId;
  }

  async update(id, data) {
    await pool.execute(
      `UPDATE drivers SET full_name = ?, employee_number = ?, email = ?, phone = ?, license_number = ?, license_expiry = ?, is_active = ?
       WHERE id = ? AND is_deleted = 0`,
      [data.full_name, data.employee_number, data.email, data.phone, data.license_number, data.license_expiry || null, data.is_active ?? 1, id]
    );
  }

  async softDelete(id) {
    await pool.execute('UPDATE drivers SET is_deleted = 1, is_active = 0 WHERE id = ?', [id]);
  }

  async findExpiringLicenses(days = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);
    const [rows] = await pool.execute(
      `SELECT * FROM drivers 
       WHERE is_active = 1 
       AND is_deleted = 0
       AND license_expiry IS NOT NULL 
       AND license_expiry <= ?
       ORDER BY license_expiry ASC`,
      [thresholdDate]
    );
    return rows;
  }
}

module.exports = new DriverRepository();
