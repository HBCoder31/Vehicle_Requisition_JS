const { pool } = require('../config/db');

class AnalyticsRepository {
  async getSummaryStats() {
    const [requests] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('Approved_HOD', 'Approved_GM_HR', 'Approved_COO', 'Vehicle_Assigned', 'In_Transit', 'Completed') THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status IN ('Rejected_HOD', 'Rejected_GM_HR', 'Rejected_COO') THEN 1 ELSE 0 END) as rejected
      FROM vehicle_requests
    `);

    const [vehicles] = await pool.execute(`SELECT COUNT(*) as active_vehicles FROM vehicles WHERE is_available = 1`);
    const [drivers] = await pool.execute(`SELECT COUNT(*) as active_drivers FROM drivers WHERE is_active = 1 AND is_deleted = 0`);

    return {
      requests: requests[0],
      vehicles: vehicles[0].active_vehicles,
      drivers: drivers[0].active_drivers
    };
  }

  async getDepartmentUsage() {
    const [rows] = await pool.execute(`
      SELECT d.name as department, COUNT(vr.id) as request_count
      FROM departments d
      LEFT JOIN vehicle_requests vr ON d.id = vr.department_id
      GROUP BY d.id
      ORDER BY request_count DESC
    `);
    return rows;
  }

  async getVehicleUtilization() {
    const [rows] = await pool.execute(`
      SELECT v.registration_no, v.make, v.model, COUNT(vr.id) as trips_completed
      FROM vehicles v
      LEFT JOIN vehicle_requests vr ON v.id = vr.assigned_vehicle_id AND vr.status = 'Completed'
      GROUP BY v.id
      ORDER BY trips_completed DESC
      LIMIT 10
    `);
    return rows;
  }

  async getFinancialStats() {
    const [fuel] = await pool.execute(`SELECT SUM(cost) as total_fuel_cost, SUM(liters) as total_liters FROM fuel_logs`);
    const [maintenance] = await pool.execute(`SELECT SUM(cost) as total_maintenance_cost FROM maintenance_records`);
    
    return {
      fuel: fuel[0],
      maintenance: maintenance[0]
    };
  }

  async getMonthlyTrend() {
    const [rows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM vehicle_requests
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `);
    return rows;
  }
}

module.exports = new AnalyticsRepository();
