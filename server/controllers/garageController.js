const { pool } = require('../config/db');
const HistoryRepository = require('../repositories/HistoryRepository');
const NotificationService = require('../services/NotificationService');
const AuditRepository = require('../repositories/AuditRepository');

/**
 * Utility: Insert an audit log entry.
 */
async function logAudit(actorId, action, entityType, entityId, details, ipAddress) {
  await AuditRepository.createLog(actorId, action, entityType, entityId, details, ipAddress);
}

// ─── GET PENDING ASSIGNMENTS ───────────────────────────────

/**
 * GET /api/garage/pending
 * Garage views all requests approved and ready for vehicle assignment.
 */
async function getPendingAssignments(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name, e.phone AS requester_phone,
              d.name AS department_name
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       WHERE vr.status IN ('Approved_HOD', 'Approved_GM_HR', 'Approved_COO')
       ORDER BY vr.travel_date ASC, vr.travel_time ASC`
    );
    res.json({ requests: rows });
  } catch (err) {
    console.error('getPendingAssignments error:', err);
    res.status(500).json({ error: 'Failed to fetch pending assignments.' });
  }
}

// ─── ASSIGN VEHICLE ────────────────────────────────────────

/**
 * PATCH /api/garage/assign/:id
 * Garage assigns a vehicle and driver to an approved request.
 *
 * Body: { vehicle_id: number, driver_name: string, remarks?: string }
 */
async function assignVehicle(req, res) {
  const conn = await pool.getConnection();
  try {
    const { vehicle_id, driver_id, remarks } = req.body;

    if (!vehicle_id || !driver_id) {
      conn.release();
      return res.status(400).json({ error: 'vehicle_id and driver_id are required.' });
    }

    await conn.beginTransaction();

    // Verify request is in assignable state (either approved or already assigned but before pickup)
    const [reqRows] = await conn.execute(
      `SELECT * FROM vehicle_requests WHERE id = ? AND status IN ('Approved_HOD', 'Approved_GM_HR', 'Approved_COO', 'Vehicle_Assigned') FOR UPDATE`,
      [req.params.id]
    );

    if (reqRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Request not found or not in assignable state.' });
    }

    const isReassignment = reqRows[0].status === 'Vehicle_Assigned';
    let previousVehicleReg = '';
    let previousDriverName = '';

    if (isReassignment) {
      const prevVehId = reqRows[0].assigned_vehicle_id;
      const prevDrvId = reqRows[0].assigned_driver_id;

      // Fetch previous vehicle info
      if (prevVehId) {
        const [prevVeh] = await conn.execute('SELECT registration_no FROM vehicles WHERE id = ?', [prevVehId]);
        if (prevVeh[0]) previousVehicleReg = prevVeh[0].registration_no;
        // Release previous vehicle
        await conn.execute('UPDATE vehicles SET is_available = 1 WHERE id = ?', [prevVehId]);
      }

      // Fetch previous driver info
      if (prevDrvId) {
        const [prevDrv] = await conn.execute('SELECT full_name FROM drivers WHERE id = ?', [prevDrvId]);
        if (prevDrv[0]) previousDriverName = prevDrv[0].full_name;
        // Release previous driver
        await conn.execute('UPDATE drivers SET is_available = 1 WHERE id = ?', [prevDrvId]);
      }
    }

    // Verify vehicle exists and is available (will be available now if it was released above)
    const [vehRows] = await conn.execute(
      'SELECT * FROM vehicles WHERE id = ? AND is_available = 1 FOR UPDATE',
      [vehicle_id]
    );

    if (vehRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Vehicle not found or not available.' });
    }
    const newVehicleReg = vehRows[0].registration_no;

    // Verify driver exists and is available
    const [driverRows] = await conn.execute(
      'SELECT * FROM drivers WHERE id = ? AND is_active = 1 AND is_available = 1 AND is_deleted = 0 FOR UPDATE',
      [driver_id]
    );

    if (driverRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Driver not found or not available.' });
    }
    const driver_name = driverRows[0].full_name;

    // Assign vehicle to request
    await conn.execute(
      `UPDATE vehicle_requests
       SET status = 'Vehicle_Assigned',
           assigned_vehicle_id = ?,
           assigned_driver_id = ?,
           assigned_driver = ?,
           garage_remarks = ?
       WHERE id = ?`,
      [vehicle_id, driver_id, driver_name, remarks || null, req.params.id]
    );

    // Mark vehicle and driver as unavailable
    await conn.execute(
      'UPDATE vehicles SET is_available = 0 WHERE id = ?',
      [vehicle_id]
    );
    await conn.execute(
      'UPDATE drivers SET is_available = 0 WHERE id = ?',
      [driver_id]
    );

    await conn.commit();
    conn.release();

    if (isReassignment) {
      let changes = [];
      if (vehicle_id !== reqRows[0].assigned_vehicle_id) {
        changes.push(`Vehicle updated from ${previousVehicleReg || 'None'} to ${newVehicleReg}`);
      }
      if (driver_id !== reqRows[0].assigned_driver_id) {
        changes.push(`Driver updated from ${previousDriverName || 'None'} to ${driver_name}`);
      }
      const changeMsg = changes.length > 0 ? changes.join(', ') : 'Assignment details updated';

      await logAudit(
        req.user.id,
        'REASSIGN_VEHICLE',
        'vehicle_request',
        parseInt(req.params.id),
        {
          previous_vehicle_id: reqRows[0].assigned_vehicle_id,
          new_vehicle_id: vehicle_id,
          previous_vehicle_reg: previousVehicleReg,
          new_vehicle_reg: newVehicleReg,
          previous_driver_id: reqRows[0].assigned_driver_id,
          new_driver_id: driver_id,
          previous_driver_name: previousDriverName,
          new_driver_name: driver_name,
          remarks: remarks || null
        },
        req.ip
      );

      await HistoryRepository.addEvent(
        req.params.id,
        req.user.id,
        'Vehicle_Reassigned',
        'Vehicle_Assigned',
        'Vehicle_Assigned',
        remarks || changeMsg
      );

      await NotificationService.notifyUser(
        reqRows[0].employee_id,
        'Vehicle Assignment Updated',
        `Your assigned vehicle details have been updated. Details: ${changeMsg}. Driver: ${driver_name}, Vehicle: ${newVehicleReg}.`,
        'System'
      );
    } else {
      await logAudit(
        req.user.id,
        'ASSIGN_VEHICLE',
        'vehicle_request',
        parseInt(req.params.id),
        { vehicle_id, driver_name },
        req.ip
      );

      await HistoryRepository.addEvent(
        req.params.id,
        req.user.id,
        'Assigned',
        reqRows[0].status,
        'Vehicle_Assigned',
        remarks || `Assigned to driver ${driver_name}`
      );

      await NotificationService.notifyUser(
        reqRows[0].employee_id,
        'Vehicle Assigned',
        `A vehicle has been assigned to your request. Driver: ${driver_name}, Vehicle: ${newVehicleReg}.`,
        'System'
      );
    }

    res.json({ message: 'Vehicle assigned successfully.' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('assignVehicle error:', err);
    res.status(500).json({ error: 'Failed to assign vehicle.' });
  }
}

// ─── RECORD PICKUP ─────────────────────────────────────────

/**
 * PATCH /api/garage/pickup/:id
 * Records pickup time; status → In_Transit.
 */
async function recordPickup(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM vehicle_requests WHERE id = ? AND status = 'Vehicle_Assigned'`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or vehicle not yet assigned.' });
    }

    await pool.execute(
      `UPDATE vehicle_requests SET status = 'In_Transit', pickup_time = NOW() WHERE id = ?`,
      [req.params.id]
    );

    await logAudit(req.user.id, 'RECORD_PICKUP', 'vehicle_request', parseInt(req.params.id), {}, req.ip);

    await HistoryRepository.addEvent(req.params.id, req.user.id, 'In_Transit', 'Vehicle_Assigned', 'In_Transit', 'Passenger picked up');
    await NotificationService.notifyUser(rows[0].employee_id, 'Trip Started', `Your trip is now in transit.`, 'System');

    res.json({ message: 'Pickup recorded. Trip is now in transit.' });
  } catch (err) {
    console.error('recordPickup error:', err);
    res.status(500).json({ error: 'Failed to record pickup.' });
  }
}

// ─── RECORD DROP-OFF ───────────────────────────────────────

/**
 * PATCH /api/garage/dropoff/:id
 * Records dropoff time; status → Completed; vehicle → available again.
 */
async function recordDropoff(req, res) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT * FROM vehicle_requests WHERE id = ? AND status = 'In_Transit'`,
      [req.params.id]
    );

    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Request not found or not in transit.' });
    }

    await conn.beginTransaction();

    await conn.execute(
      `UPDATE vehicle_requests SET status = 'Completed', dropoff_time = NOW() WHERE id = ?`,
      [req.params.id]
    );

    // Release the vehicle and driver back to available
    if (rows[0].assigned_vehicle_id) {
      await conn.execute(
        'UPDATE vehicles SET is_available = 1 WHERE id = ?',
        [rows[0].assigned_vehicle_id]
      );
    }
    if (rows[0].assigned_driver_id) {
      await conn.execute(
        'UPDATE drivers SET is_available = 1 WHERE id = ?',
        [rows[0].assigned_driver_id]
      );
    }

    await conn.commit();
    conn.release();

    await logAudit(req.user.id, 'RECORD_DROPOFF', 'vehicle_request', parseInt(req.params.id), {}, req.ip);

    await HistoryRepository.addEvent(req.params.id, req.user.id, 'Completed', 'In_Transit', 'Completed', 'Trip completed successfully');
    await NotificationService.notifyUser(rows[0].employee_id, 'Trip Completed', `Your trip has been completed.`, 'System');

    res.json({ message: 'Drop-off recorded. Trip completed.' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('recordDropoff error:', err);
    res.status(500).json({ error: 'Failed to record drop-off.' });
  }
}

// ─── GET VEHICLES ──────────────────────────────────────────

/**
 * GET /api/garage/vehicles
 * List all vehicles with availability status.
 */
async function getVehicles(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT v.*,
             (SELECT status FROM vehicle_requests 
              WHERE assigned_vehicle_id = v.id AND status IN ('Vehicle_Assigned', 'In_Transit') 
              LIMIT 1) AS trip_status,
             (SELECT status FROM vehicle_maintenance 
              WHERE vehicle_id = v.id AND status IN ('Scheduled', 'In_Progress') 
              LIMIT 1) AS maintenance_status
      FROM vehicles v
      ORDER BY v.is_available DESC, v.make ASC
    `);
    res.json({ vehicles: rows });
  } catch (err) {
    console.error('getVehicles error:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles.' });
  }
}

// ─── GET ACTIVE TRIPS ──────────────────────────────────────

/**
 * GET /api/garage/active
 * Garage views requests that are Vehicle_Assigned or In_Transit.
 */
async function getActiveTrips(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name,
              d.name AS department_name,
              v.registration_no, v.make AS vehicle_make, v.model AS vehicle_model
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       LEFT JOIN vehicles v ON vr.assigned_vehicle_id = v.id
       WHERE vr.status IN ('Vehicle_Assigned', 'In_Transit')
       ORDER BY vr.travel_date ASC`
    );
    res.json({ trips: rows });
  } catch (err) {
    console.error('getActiveTrips error:', err);
    res.status(500).json({ error: 'Failed to fetch active trips.' });
  }
}

// ─── GET HISTORY ───────────────────────────────────────────

/**
 * GET /api/garage/history
 * Garage views completed trips with employee number.
 */
async function getHistory(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT vr.*,
              e.full_name AS requester_name,
              e.employee_number,
              d.name AS department_name,
              v.registration_no, v.make AS vehicle_make, v.model AS vehicle_model
       FROM vehicle_requests vr
       JOIN employees e ON vr.employee_id = e.id
       JOIN departments d ON vr.department_id = d.id
       LEFT JOIN vehicles v ON vr.assigned_vehicle_id = v.id
       WHERE vr.status = 'Completed'
       ORDER BY vr.dropoff_time DESC`
    );
    res.json({ history: rows });
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
}

// ─── GET DRIVERS ───────────────────────────────────────────

/**
 * GET /api/garage/drivers
 * Garage views all active drivers.
 */
async function getDrivers(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM drivers WHERE is_active = 1 AND is_deleted = 0 ORDER BY full_name ASC'
    );
    res.json({ drivers: rows });
  } catch (err) {
    console.error('getDrivers error:', err);
    res.status(500).json({ error: 'Failed to fetch drivers.' });
  }
}

// ─── UPDATE DRIVER STATUS ──────────────────────────────────

/**
 * PATCH /api/garage/drivers/:id/status
 * Garage manager sets driver to Active or On Leave.
 */
async function updateDriverStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body; // 'Active' or 'On Leave'

  if (!['Active', 'On Leave'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be Active or On Leave.' });
  }

  try {
    const is_active = status === 'Active' ? 1 : 0;

    // Get driver details for audit log
    const [[driver]] = await pool.execute('SELECT * FROM drivers WHERE id = ? AND is_deleted = 0', [id]);
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });

    // Validate: if driver is on trip (is_available = 0) and setting status to 'On Leave' (is_active = 0)
    if (is_active === 0 && driver.is_available === 0) {
      return res.status(400).json({ error: 'Cannot set driver on leave while they are on an active trip.' });
    }

    const previousStatus = driver.is_active ? 'Active' : 'On Leave';

    // Update driver status
    await pool.execute('UPDATE drivers SET is_active = ? WHERE id = ?', [is_active, id]);

    // Log to audit_logs
    await logAudit(
      req.user.id,
      'DRIVER_STATUS_CHANGED',
      'driver',
      parseInt(id),
      {
        driver_name: driver.full_name,
        employee_number: driver.employee_number,
        previous_status: previousStatus,
        new_status: status,
        changed_by: req.user.full_name,
      },
      req.ip || null
    );

    res.json({
      message: `Driver ${driver.full_name} status updated to ${status}.`,
      status,
    });
  } catch (err) {
    console.error('updateDriverStatus error:', err);
    res.status(500).json({ error: 'Failed to update driver status.' });
  }
}

// ─── VEHICLE CRUD ──────────────────────────────────────────

/**
 * POST /api/garage/vehicles
 * Create a new vehicle.
 */
async function createVehicle(req, res) {
  try {
    const {
      registration_no, make, model, vehicle_type, capacity, fuel_type,
      current_odometer, insurance_expiry, fitness_expiry, pollution_expiry
    } = req.body;

    if (!registration_no || !make || !model || !vehicle_type || !capacity || !fuel_type) {
      return res.status(400).json({ error: 'registration_no, make, model, vehicle_type, capacity, and fuel_type are required.' });
    }

    // Check duplicate
    const [existing] = await pool.execute('SELECT id FROM vehicles WHERE registration_no = ?', [registration_no]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A vehicle with this registration number already exists.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO vehicles (
        registration_no, make, model, vehicle_type, capacity, fuel_type, 
        current_odometer, insurance_expiry, fitness_expiry, pollution_expiry, is_available, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        registration_no, make, model, vehicle_type, capacity, fuel_type,
        current_odometer || 0, insurance_expiry || null, fitness_expiry || null, pollution_expiry || null
      ]
    );

    await logAudit(req.user.id, 'CREATE_VEHICLE', 'vehicle', result.insertId, { registration_no, make, model }, req.ip);

    res.status(201).json({
      message: 'Vehicle created successfully.',
      vehicleId: result.insertId
    });
  } catch (err) {
    console.error('createVehicle error:', err);
    res.status(500).json({ error: 'Failed to create vehicle.' });
  }
}

/**
 * PUT /api/garage/vehicles/:id
 * Update an existing vehicle.
 */
async function updateVehicle(req, res) {
  try {
    const { id } = req.params;
    const {
      registration_no, make, model, vehicle_type, capacity, fuel_type,
      current_odometer, insurance_expiry, fitness_expiry, pollution_expiry, is_active
    } = req.body;

    const [existing] = await pool.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    if (registration_no) {
      const [dup] = await pool.execute('SELECT id FROM vehicles WHERE registration_no = ? AND id != ?', [registration_no, id]);
      if (dup.length > 0) {
        return res.status(409).json({ error: 'A vehicle with this registration number already exists.' });
      }
    }

    let query = 'UPDATE vehicles SET ';
    const params = [];

    if (registration_no !== undefined) { query += 'registration_no = ?, '; params.push(registration_no); }
    if (make !== undefined) { query += 'make = ?, '; params.push(make); }
    if (model !== undefined) { query += 'model = ?, '; params.push(model); }
    if (vehicle_type !== undefined) { query += 'vehicle_type = ?, '; params.push(vehicle_type); }
    if (capacity !== undefined) { query += 'capacity = ?, '; params.push(capacity); }
    if (fuel_type !== undefined) { query += 'fuel_type = ?, '; params.push(fuel_type); }
    if (current_odometer !== undefined) { query += 'current_odometer = ?, '; params.push(current_odometer); }
    if (insurance_expiry !== undefined) { query += 'insurance_expiry = ?, '; params.push(insurance_expiry || null); }
    if (fitness_expiry !== undefined) { query += 'fitness_expiry = ?, '; params.push(fitness_expiry || null); }
    if (pollution_expiry !== undefined) { query += 'pollution_expiry = ?, '; params.push(pollution_expiry || null); }
    if (is_active !== undefined) { query += 'is_active = ?, '; params.push(is_active ? 1 : 0); }

    query = query.slice(0, -2);
    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);

    await logAudit(req.user.id, 'UPDATE_VEHICLE', 'vehicle', parseInt(id), req.body, req.ip);

    res.json({ message: 'Vehicle updated successfully.' });
  } catch (err) {
    console.error('updateVehicle error:', err);
    res.status(500).json({ error: 'Failed to update vehicle.' });
  }
}

/**
 * PATCH /api/garage/vehicles/:id/status
 * Toggle activation status of a vehicle.
 */
async function toggleVehicleStatus(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const newStatus = existing[0].is_active ? 0 : 1;
    await pool.execute(
      'UPDATE vehicles SET is_active = ?, is_available = ? WHERE id = ?',
      [newStatus, newStatus, id]
    );

    await logAudit(req.user.id, newStatus ? 'RESTORE_VEHICLE' : 'DEACTIVATE_VEHICLE', 'vehicle', parseInt(id), {}, req.ip);

    res.json({ message: `Vehicle ${newStatus ? 'activated' : 'deactivated'} successfully.`, is_active: newStatus });
  } catch (err) {
    console.error('toggleVehicleStatus error:', err);
    res.status(500).json({ error: 'Failed to toggle vehicle status.' });
  }
}

/**
 * DELETE /api/garage/vehicles/:id
 * Hard delete a vehicle.
 */
async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    await pool.execute('DELETE FROM vehicles WHERE id = ?', [id]);

    await logAudit(req.user.id, 'DELETE_VEHICLE', 'vehicle', parseInt(id), {}, req.ip);

    res.json({ message: 'Vehicle deleted successfully.' });
  } catch (err) {
    console.error('deleteVehicle error:', err);
    res.status(500).json({ error: 'Failed to delete vehicle.' });
  }
}

module.exports = {
  getPendingAssignments,
  assignVehicle,
  recordPickup,
  recordDropoff,
  getVehicles,
  getActiveTrips,
  getHistory,
  getDrivers,
  updateDriverStatus,
  createVehicle,
  updateVehicle,
  toggleVehicleStatus,
  deleteVehicle,
};
