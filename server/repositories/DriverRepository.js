const { pool } = require('../config/db');

class DriverRepository {
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM drivers ORDER BY full_name ASC');
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM drivers WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO drivers (full_name, employee_number, email, phone, license_number, license_expiry, campus_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.full_name, data.employee_number, data.email, data.phone, data.license_number, data.license_expiry, data.campus_id || null, data.is_active ?? 1]
    );
    return result.insertId;
  }

  async update(id, data) {
    await pool.execute(
      `UPDATE drivers SET full_name = ?, employee_number = ?, email = ?, phone = ?, license_number = ?, license_expiry = ?, is_active = ?
       WHERE id = ?`,
      [data.full_name, data.employee_number, data.email, data.phone, data.license_number, data.license_expiry, data.is_active ?? 1, id]
    );
  }

  async findExpiringLicenses(days = 30) {
    const [rows] = await pool.execute(
      `SELECT * FROM drivers 
       WHERE is_active = 1 
       AND license_expiry IS NOT NULL 
       AND license_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY license_expiry ASC`,
      [days]
    );
    return rows;
  }
}

module.exports = new DriverRepository();
