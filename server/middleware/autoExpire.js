const { pool } = require('../config/db');

module.exports = async (req, res, next) => {
  // Only run auto-expiry for API routes to keep db state fresh
  if (req.originalUrl.startsWith('/api')) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Find any expiring requests that have vehicles/drivers assigned
      const [assignedRequests] = await conn.execute(`
        SELECT assigned_vehicle_id, assigned_driver_id 
        FROM vehicle_requests
        WHERE status = 'Vehicle_Assigned'
          AND (
            travel_date < CURDATE()
            OR (travel_date = CURDATE() AND travel_time < CURTIME())
          )
      `);

      if (assignedRequests.length > 0) {
        const vehicleIds = assignedRequests.map(r => r.assigned_vehicle_id).filter(Boolean);
        const driverIds = assignedRequests.map(r => r.assigned_driver_id).filter(Boolean);

        if (vehicleIds.length > 0) {
          const placeholders = vehicleIds.map(() => '?').join(',');
          await conn.execute(`
            UPDATE vehicles 
            SET is_available = 1 
            WHERE id IN (${placeholders})
          `, vehicleIds);
        }

        if (driverIds.length > 0) {
          const placeholders = driverIds.map(() => '?').join(',');
          await conn.execute(`
            UPDATE drivers 
            SET is_available = 1 
            WHERE id IN (${placeholders})
          `, driverIds);
        }
      }

      // Update all expiring requests to 'Expired' status
      await conn.execute(`
        UPDATE vehicle_requests 
        SET status = 'Expired'
        WHERE status NOT IN ('Completed', 'Cancelled', 'Deleted', 'Vehicle Out', 'Vehicle Returned', 'Expired')
          AND (
            travel_date < CURDATE()
            OR (travel_date = CURDATE() AND travel_time < CURTIME())
          )
      `);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error('Auto-expiry check failed:', err);
    } finally {
      conn.release();
    }
  }
  next();
};
