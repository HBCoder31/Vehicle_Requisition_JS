const { pool } = require('../config/db');

class Phase2Repository {
  // --- 1. Security Gate Management ---
  
  async getPendingExits() {
    const [rows] = await pool.execute(`
      SELECT vr.*, e.full_name AS requester_name, e.employee_number, d.name AS department_name, 
             v.registration_no, v.make, v.model, v.vehicle_type,
             dr_u.full_name AS driver_name
      FROM vehicle_requests vr
      JOIN employees e ON vr.employee_id = e.id
      JOIN departments d ON vr.department_id = d.id
      LEFT JOIN vehicles v ON vr.assigned_vehicle_id = v.id
      LEFT JOIN drivers dr ON vr.assigned_driver_id = dr.id
      LEFT JOIN employees dr_u ON dr.user_id = dr_u.id
      WHERE vr.status = 'Vehicle_Assigned'
        AND vr.id NOT IN (SELECT request_id FROM vehicle_trip_logs)
      ORDER BY vr.travel_date ASC, vr.travel_time ASC
    `);
    return rows;
  }

  async getPendingEntries() {
    const [rows] = await pool.execute(`
      SELECT tl.*, vr.destination, vr.pickup_location, vr.travel_date, vr.travel_time,
             e.full_name AS requester_name, e.employee_number, d.name AS department_name,
             v.registration_no, v.make, v.model, v.vehicle_type,
             dr_u.full_name AS driver_name
      FROM vehicle_trip_logs tl
      JOIN vehicle_requests vr ON tl.request_id = vr.id
      JOIN employees e ON tl.employee_id = e.id
      JOIN departments d ON vr.department_id = d.id
      JOIN vehicles v ON tl.vehicle_id = v.id
      JOIN drivers dr ON tl.driver_id = dr.id
      LEFT JOIN employees dr_u ON dr.user_id = dr_u.id
      WHERE tl.status = 'Vehicle Out'
      ORDER BY tl.exit_time ASC
    `);
    return rows;
  }

  async recordExit(exitData, guardId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert into vehicle_trip_logs
      const [result] = await connection.execute(`
        INSERT INTO vehicle_trip_logs (
          request_id, vehicle_id, driver_id, employee_id,
          odometer_out, fuel_level_out, gate_no_out, security_guard_out, remarks_out, photo_url_out,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Vehicle Out')
      `, [
        exitData.request_id,
        exitData.vehicle_id,
        exitData.driver_id,
        exitData.employee_id,
        exitData.odometer_out,
        exitData.fuel_level_out || null,
        exitData.gate_no_out,
        exitData.security_guard_name,
        exitData.remarks_out || null,
        exitData.photo_url_out || null
      ]);
      const tripLogId = result.insertId;

      // 2. Insert into odometer_entries
      await connection.execute(`
        INSERT INTO odometer_entries (vehicle_id, trip_log_id, reading_val, type, recorded_by, remarks)
        VALUES (?, ?, ?, 'Exit', ?, ?)
      `, [
        exitData.vehicle_id,
        tripLogId,
        exitData.odometer_out,
        guardId,
        `Exit Gate Logging. Gate: ${exitData.gate_no_out}`
      ]);

      // 3. Update vehicle_requests status to 'Vehicle Out'
      await connection.execute(
        `UPDATE vehicle_requests SET status = 'Vehicle Out' WHERE id = ?`,
        [exitData.request_id]
      );

      // 4. Update vehicle status to 'In_Use' and set odometer
      await connection.execute(
        `UPDATE vehicles SET status = 'In_Use', current_odometer = ? WHERE id = ?`,
        [exitData.odometer_out, exitData.vehicle_id]
      );

      await connection.commit();
      return tripLogId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async recordEntry(entryData, guardId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Fetch the trip log details to get odometer_out, vehicle_id, and employee_id
      const [tripRows] = await connection.execute(
        `SELECT tl.*, v.vehicle_type FROM vehicle_trip_logs tl 
         JOIN vehicles v ON tl.vehicle_id = v.id 
         WHERE tl.request_id = ?`,
        [entryData.request_id]
      );
      if (tripRows.length === 0) {
        throw new Error('Trip log not found for this request.');
      }
      const tripLog = tripRows[0];

      const distance = entryData.odometer_in - tripLog.odometer_out;
      if (distance < 0) {
        throw new Error('Odometer In cannot be less than Odometer Out.');
      }

      // 2. Fetch Cost per KM for the vehicle type
      const [costRows] = await connection.execute(
        `SELECT cost_per_km FROM travel_costs WHERE vehicle_type = ?`,
        [tripLog.vehicle_type]
      );
      const costPerKm = costRows.length > 0 ? parseFloat(costRows[0].cost_per_km) : 0.00;
      const travelCost = distance * costPerKm;

      // 3. Update vehicle_trip_logs
      await connection.execute(`
        UPDATE vehicle_trip_logs SET
          entry_time = CURRENT_TIMESTAMP,
          odometer_in = ?,
          fuel_level_in = ?,
          vehicle_condition = ?,
          damage_report = ?,
          remarks_in = ?,
          photo_url_in = ?,
          distance_travelled = ?,
          cost_per_km = ?,
          travel_cost = ?,
          status = 'Vehicle Returned'
        WHERE request_id = ?
      `, [
        entryData.odometer_in,
        entryData.fuel_level_in || null,
        entryData.vehicle_condition || null,
        entryData.damage_report || null,
        entryData.remarks_in || null,
        entryData.photo_url_in || null,
        distance,
        costPerKm,
        travelCost,
        entryData.request_id
      ]);

      // 4. Insert into odometer_entries
      await connection.execute(`
        INSERT INTO odometer_entries (vehicle_id, trip_log_id, reading_val, type, recorded_by, remarks)
        VALUES (?, ?, ?, 'Return', ?, ?)
      `, [
        tripLog.vehicle_id,
        tripLog.id,
        entryData.odometer_in,
        guardId,
        `Return Gate Logging. Condition: ${entryData.vehicle_condition || 'Ok'}`
      ]);

      // 5. Update vehicle_requests status to 'Vehicle Returned' (or 'Completed')
      await connection.execute(
        `UPDATE vehicle_requests SET status = 'Vehicle Returned' WHERE id = ?`,
        [entryData.request_id]
      );

      // 6. Update vehicle status to 'Available' and set odometer
      await connection.execute(
        `UPDATE vehicles SET status = 'Available', current_odometer = ? WHERE id = ?`,
        [entryData.odometer_in, tripLog.vehicle_id]
      );

      // 7. Update employee_travel_summary
      const [summaryRows] = await connection.execute(
        `SELECT * FROM employee_travel_summary WHERE employee_id = ?`,
        [tripLog.employee_id]
      );
      if (summaryRows.length === 0) {
        await connection.execute(`
          INSERT INTO employee_travel_summary (employee_id, total_trips, total_distance, total_cost, total_paid, outstanding_balance)
          VALUES (?, 1, ?, ?, 0.00, ?)
        `, [tripLog.employee_id, distance, travelCost, travelCost]);
      } else {
        const summary = summaryRows[0];
        const newTotalTrips = summary.total_trips + 1;
        const newTotalDistance = parseFloat(summary.total_distance) + distance;
        const newTotalCost = parseFloat(summary.total_cost) + travelCost;
        const newOutstanding = newTotalCost - parseFloat(summary.total_paid);
        await connection.execute(`
          UPDATE employee_travel_summary SET
            total_trips = ?,
            total_distance = ?,
            total_cost = ?,
            outstanding_balance = ?
          WHERE employee_id = ?
        `, [newTotalTrips, newTotalDistance, newTotalCost, newOutstanding, tripLog.employee_id]);
      }

      await connection.commit();
      return { distance, travelCost, costPerKm };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // --- 2. Travel History & Ledgers ---

  async getEmployeeTravelHistory(employeeId) {
    const [rows] = await pool.execute(`
      SELECT tl.*, vr.destination, vr.pickup_location, vr.travel_date, vr.travel_time,
             v.registration_no, v.make, v.model, v.vehicle_type,
             dr_u.full_name AS driver_name
      FROM vehicle_trip_logs tl
      JOIN vehicle_requests vr ON tl.request_id = vr.id
      JOIN vehicles v ON tl.vehicle_id = v.id
      JOIN drivers dr ON tl.driver_id = dr.id
      LEFT JOIN employees dr_u ON dr.user_id = dr_u.id
      WHERE tl.employee_id = ?
      ORDER BY tl.exit_time DESC
    `, [employeeId]);
    return rows;
  }

  async getEmployeeTravelSummary(employeeId) {
    const [rows] = await pool.execute(
      `SELECT * FROM employee_travel_summary WHERE employee_id = ?`,
      [employeeId]
    );
    return rows[0] || {
      employee_id: employeeId,
      total_trips: 0,
      total_distance: 0.00,
      total_cost: 0.00,
      total_paid: 0.00,
      outstanding_balance: 0.00
    };
  }

  // --- 3. Rates & Billing ---

  async getTravelCosts() {
    const [rows] = await pool.execute(`
      SELECT tc.*, e.full_name AS updater_name 
      FROM travel_costs tc
      LEFT JOIN employees e ON tc.updated_by = e.id
      ORDER BY tc.vehicle_type ASC
    `);
    return rows;
  }

  async updateTravelCost(vehicleType, costPerKm, userId) {
    await pool.execute(`
      INSERT INTO travel_costs (vehicle_type, cost_per_km, updated_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE cost_per_km = VALUES(cost_per_km), updated_by = VALUES(updated_by)
    `, [vehicleType, costPerKm, userId]);
  }

  // --- 4. Payments Management ---

  async getEmployeeBalances() {
    const [rows] = await pool.execute(`
      SELECT e.id, e.employee_number, e.full_name, e.email, dept.name AS department_name,
             COALESCE(ets.total_trips, 0) AS total_trips,
             COALESCE(ets.total_distance, 0.00) AS total_distance,
             COALESCE(ets.total_cost, 0.00) AS total_cost,
             COALESCE(ets.total_paid, 0.00) AS total_paid,
             COALESCE(ets.outstanding_balance, 0.00) AS outstanding_balance
      FROM employees e
      LEFT JOIN departments dept ON e.department_id = dept.id
      LEFT JOIN employee_travel_summary ets ON e.id = ets.employee_id
      WHERE e.role != 'Admin' AND e.role != 'Security Guard'
      ORDER BY outstanding_balance DESC, e.full_name ASC
    `);
    return rows;
  }

  async getPaymentHistory(employeeId) {
    const [rows] = await pool.execute(`
      SELECT ph.*, e.full_name AS recorder_name
      FROM payment_history ph
      JOIN employees e ON ph.recorded_by = e.id
      WHERE ph.employee_id = ?
      ORDER BY ph.payment_date DESC, ph.created_at DESC
    `, [employeeId]);
    return rows;
  }

  async recordPayment(paymentData, adminId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert into payment_history
      await connection.execute(`
        INSERT INTO payment_history (employee_id, payment_date, amount_paid, payment_mode, receipt_number, remarks, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        paymentData.employee_id,
        paymentData.payment_date,
        paymentData.amount_paid,
        paymentData.payment_mode,
        paymentData.receipt_number,
        paymentData.remarks || null,
        adminId
      ]);

      // 2. Fetch or initialize employee_travel_summary
      const [summaryRows] = await connection.execute(
        `SELECT * FROM employee_travel_summary WHERE employee_id = ?`,
        [paymentData.employee_id]
      );
      
      if (summaryRows.length === 0) {
        // No trips completed, but recording payment anyway
        await connection.execute(`
          INSERT INTO employee_travel_summary (employee_id, total_trips, total_distance, total_cost, total_paid, outstanding_balance)
          VALUES (?, 0, 0.00, 0.00, ?, ?)
        `, [paymentData.employee_id, paymentData.amount_paid, -paymentData.amount_paid]);
      } else {
        const summary = summaryRows[0];
        const newTotalPaid = parseFloat(summary.total_paid) + parseFloat(paymentData.amount_paid);
        const newOutstanding = parseFloat(summary.total_cost) - newTotalPaid;
        await connection.execute(`
          UPDATE employee_travel_summary SET
            total_paid = ?,
            outstanding_balance = ?
          WHERE employee_id = ?
        `, [newTotalPaid, newOutstanding, paymentData.employee_id]);
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  // --- 5. Billing ---

  async getBillDetails(tripLogId) {
    const [rows] = await pool.execute(`
      SELECT tl.*, 
             e.full_name AS requester_name, e.email AS requester_email, e.employee_number, 
             dept.name AS department_name, dept.code AS department_code,
             v.registration_no, v.make, v.model, v.vehicle_type,
             dr_u.full_name AS driver_name,
             ets.total_paid, ets.outstanding_balance
      FROM vehicle_trip_logs tl
      JOIN employees e ON tl.employee_id = e.id
      JOIN departments dept ON e.department_id = dept.id
      JOIN vehicles v ON tl.vehicle_id = v.id
      JOIN drivers dr ON tl.driver_id = dr.id
      LEFT JOIN employees dr_u ON dr.user_id = dr_u.id
      LEFT JOIN employee_travel_summary ets ON e.id = ets.employee_id
      WHERE tl.id = ?
    `, [tripLogId]);
    return rows[0] || null;
  }

  async logBillGeneration(tripLogId, billNumber, userId) {
    await pool.execute(`
      INSERT INTO generated_bills (trip_log_id, bill_number, generated_by)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE bill_number = VALUES(bill_number), generated_by = VALUES(generated_by)
    `, [tripLogId, billNumber, userId]);
  }

  // --- 6. Analytics ---

  async getGarageFleetStatus() {
    // Current odometer, total KM, daily/monthly running KM, utilization, availability, driver assignment
    const [vehicles] = await pool.execute(`
      SELECT v.id, v.registration_no, v.make, v.model, v.vehicle_type, v.status, v.current_odometer,
             COALESCE(SUM(tl.distance_travelled), 0) AS total_km,
             COALESCE(SUM(CASE WHEN DATE(tl.entry_time) = CURDATE() THEN tl.distance_travelled ELSE 0 END), 0) AS daily_km,
             COALESCE(SUM(CASE WHEN MONTH(tl.entry_time) = MONTH(CURDATE()) AND YEAR(tl.entry_time) = YEAR(CURDATE()) THEN tl.distance_travelled ELSE 0 END), 0) AS monthly_km,
             COUNT(DISTINCT tl.id) AS total_trips
      FROM vehicles v
      LEFT JOIN vehicle_trip_logs tl ON v.id = tl.vehicle_id
      WHERE v.is_active = 1
      GROUP BY v.id
    `);
    
    const [outsideVehicles] = await pool.execute(`
      SELECT v.registration_no, v.make, v.model, dr_u.full_name AS driver_name, e.full_name AS requester_name, tl.exit_time
      FROM vehicle_trip_logs tl
      JOIN vehicles v ON tl.vehicle_id = v.id
      JOIN drivers dr ON tl.driver_id = dr.id
      LEFT JOIN employees dr_u ON dr.user_id = dr_u.id
      JOIN employees e ON tl.employee_id = e.id
      WHERE tl.status = 'Vehicle Out'
    `);

    const [pendingTripsCount] = await pool.execute(`
      SELECT COUNT(*) AS count FROM vehicle_requests WHERE status = 'Vehicle_Assigned'
    `);

    return { vehicles, outsideVehicles, pendingTrips: pendingTripsCount[0].count };
  }

  async getFleetAnalyticsSummary(filters = {}) {
    // Company-wide distance, travel cost, department/employee comparisons, utilization, unpaid outstanding
    let deptQuery = `
      SELECT d.name AS department_name, d.code AS department_code,
             COUNT(DISTINCT tl.id) AS total_trips,
             COALESCE(SUM(tl.distance_travelled), 0) AS total_distance,
             COALESCE(SUM(tl.travel_cost), 0.00) AS total_cost
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id
      LEFT JOIN vehicle_trip_logs tl ON e.id = tl.employee_id
      GROUP BY d.id
    `;

    let employeeQuery = `
      SELECT e.full_name, e.employee_number, d.name AS department_name,
             COALESCE(ets.total_trips, 0) AS total_trips,
             COALESCE(ets.total_distance, 0) AS total_distance,
             COALESCE(ets.total_cost, 0.00) AS total_cost,
             COALESCE(ets.outstanding_balance, 0.00) AS outstanding_balance
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      LEFT JOIN employee_travel_summary ets ON e.id = ets.employee_id
      WHERE ets.total_trips > 0
      ORDER BY ets.total_cost DESC
      LIMIT 10
    `;

    let vehicleQuery = `
      SELECT v.registration_no, v.make, v.model, v.vehicle_type,
             COUNT(tl.id) AS total_trips,
             COALESCE(SUM(tl.distance_travelled), 0) AS total_distance,
             COALESCE(SUM(tl.travel_cost), 0.00) AS total_cost
      FROM vehicles v
      LEFT JOIN vehicle_trip_logs tl ON v.id = tl.vehicle_id
      GROUP BY v.id
    `;

    let monthlyQuery = `
      SELECT DATE_FORMAT(tl.entry_time, '%Y-%m') AS month,
             COALESCE(SUM(tl.distance_travelled), 0) AS total_distance,
             COALESCE(SUM(tl.travel_cost), 0.00) AS total_cost
      FROM vehicle_trip_logs tl
      WHERE tl.status = 'Vehicle Returned'
      GROUP BY month
      ORDER BY month ASC
    `;

    const [deptStats] = await pool.execute(deptQuery);
    const [empStats] = await pool.execute(employeeQuery);
    const [vehStats] = await pool.execute(vehicleQuery);
    const [monthlyStats] = await pool.execute(monthlyQuery);

    const [totals] = await pool.execute(`
      SELECT COALESCE(SUM(distance_travelled), 0) AS total_distance,
             COALESCE(SUM(travel_cost), 0.00) AS total_cost,
             COALESCE((SELECT SUM(amount_paid) FROM payment_history), 0.00) AS total_paid,
             COALESCE((SELECT SUM(outstanding_balance) FROM employee_travel_summary), 0.00) AS total_outstanding
      FROM vehicle_trip_logs
      WHERE status = 'Vehicle Returned'
    `);

    return {
      totals: totals[0],
      departmentBreakdown: deptStats,
      topEmployees: empStats,
      vehicleBreakdown: vehStats,
      monthlyBreakdown: monthlyStats
    };
  }

  async getDepartmentAnalytics(departmentId) {
    // Scoped HOD view
    const [totals] = await pool.execute(`
      SELECT COUNT(tl.id) AS total_trips,
             COALESCE(SUM(tl.distance_travelled), 0) AS total_distance,
             COALESCE(SUM(tl.travel_cost), 0.00) AS total_cost,
             COALESCE(SUM(ets.outstanding_balance), 0.00) AS total_outstanding
      FROM employees e
      LEFT JOIN vehicle_trip_logs tl ON e.id = tl.employee_id
      LEFT JOIN employee_travel_summary ets ON e.id = ets.employee_id
      WHERE e.department_id = ?
    `, [departmentId]);

    const [employeesList] = await pool.execute(`
      SELECT e.full_name, e.employee_number,
             COALESCE(ets.total_trips, 0) AS total_trips,
             COALESCE(ets.total_distance, 0) AS total_distance,
             COALESCE(ets.total_cost, 0.00) AS total_cost,
             COALESCE(ets.outstanding_balance, 0.00) AS outstanding_balance
      FROM employees e
      LEFT JOIN employee_travel_summary ets ON e.id = ets.employee_id
      WHERE e.department_id = ? AND e.role != 'HOD'
      ORDER BY total_cost DESC
    `, [departmentId]);

    const [recentTrips] = await pool.execute(`
      SELECT tl.*, vr.destination, vr.travel_date, e.full_name AS requester_name, v.registration_no
      FROM vehicle_trip_logs tl
      JOIN vehicle_requests vr ON tl.request_id = vr.id
      JOIN employees e ON tl.employee_id = e.id
      JOIN vehicles v ON tl.vehicle_id = v.id
      WHERE e.department_id = ?
      ORDER BY tl.exit_time DESC
      LIMIT 10
    `, [departmentId]);

    return {
      totals: totals[0],
      employees: employeesList,
      recentTrips
    };
  }
}

module.exports = new Phase2Repository();
