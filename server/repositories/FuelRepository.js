const { pool } = require('../config/db');

class FuelRepository {
  async findAll() {
    const [rows] = await pool.execute(`
      SELECT f.*, v.registration_no, v.make, v.model, d.full_name as driver_name
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      LEFT JOIN drivers d ON f.driver_id = d.id
      ORDER BY f.log_date DESC
    `);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM fuel_logs WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO fuel_logs (vehicle_id, driver_id, log_date, liters, cost, odometer_reading, receipt_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.vehicle_id, data.driver_id || null, data.log_date, data.liters, data.cost, data.odometer_reading, data.receipt_url || null]
    );

    // Update vehicle's current_odometer
    await pool.execute(
      'UPDATE vehicles SET current_odometer = GREATEST(current_odometer, ?) WHERE id = ?',
      [data.odometer_reading, data.vehicle_id]
    );

    return result.insertId;
  }
}

module.exports = new FuelRepository();
