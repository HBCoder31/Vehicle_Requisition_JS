const { pool } = require('../config/db');
const MaintenanceService = require('../services/MaintenanceService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const AuditRepository = require('../repositories/AuditRepository');

// ─── GET ALL SCHEDULES ────────────────────────────────────
exports.getAllSchedules = catchAsync(async (req, res) => {
  const schedules = await MaintenanceService.getAllSchedules();
  res.json({ status: 'success', data: schedules });
});

// ─── GET AVAILABLE VEHICLES FOR MAINTENANCE ───────────────
// Only returns vehicles that are available (not on trip/assigned)
exports.getAvailableVehicles = catchAsync(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT v.id, v.registration_no, v.make, v.model, v.vehicle_type, v.capacity, v.fuel_type, v.is_available, v.is_active
     FROM vehicles v
     WHERE v.is_available = 1 AND v.is_active = 1
       AND v.id NOT IN (
         SELECT vehicle_id FROM vehicle_maintenance
         WHERE status IN ('Scheduled', 'In_Progress')
       )
     ORDER BY v.make ASC, v.model ASC`
  );
  res.json({ status: 'success', data: rows });
});

// ─── SCHEDULE MAINTENANCE ─────────────────────────────────
exports.scheduleMaintenance = catchAsync(async (req, res) => {
  const { vehicle_id, scheduled_date, description } = req.body;

  if (!vehicle_id || !scheduled_date || !description) {
    throw new AppError('vehicle_id, scheduled_date, and description are required.', 400);
  }

  // Validate date: no past dates allowed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const schedDate = new Date(scheduled_date);
  schedDate.setHours(0, 0, 0, 0);

  if (schedDate < today) {
    throw new AppError('Cannot schedule maintenance for a past date. Please select today or a future date.', 400);
  }

  // Verify vehicle exists, is available, and not on a trip
  const [vehRows] = await pool.execute(
    'SELECT * FROM vehicles WHERE id = ? AND is_available = 1 AND is_active = 1',
    [vehicle_id]
  );

  if (vehRows.length === 0) {
    throw new AppError('Vehicle not found, is currently on a trip, or is deactivated. Only available vehicles can be scheduled for maintenance.', 400);
  }

  // Check if vehicle already has an active maintenance schedule
  const [existingMaint] = await pool.execute(
    `SELECT id FROM vehicle_maintenance WHERE vehicle_id = ? AND status IN ('Scheduled', 'In_Progress')`,
    [vehicle_id]
  );

  if (existingMaint.length > 0) {
    throw new AppError('This vehicle already has an active maintenance schedule. Complete or cancel it before scheduling a new one.', 409);
  }

  const data = {
    vehicle_id,
    scheduled_date,
    description,
    status: 'Scheduled',
    created_by: req.user.id
  };

  const schedule = await MaintenanceService.scheduleMaintenance(data, req.user.id);

  // Mark vehicle as unavailable (it's going to maintenance)
  await pool.execute('UPDATE vehicles SET is_available = 0 WHERE id = ?', [vehicle_id]);

  // Audit log
  await AuditRepository.createLog(
    req.user.id,
    'SCHEDULE_MAINTENANCE',
    'vehicle_maintenance',
    schedule.id || 0,
    { vehicle_id, scheduled_date, description, registration_no: vehRows[0].registration_no },
    req.ip
  );

  res.status(201).json({ status: 'success', data: schedule });
});

// ─── UPDATE MAINTENANCE STATUS ────────────────────────────
exports.updateMaintenanceStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['In_Progress', 'Completed', 'Cancelled'].includes(status)) {
    throw new AppError('Invalid status. Must be In_Progress, Completed, or Cancelled.', 400);
  }

  const [rows] = await pool.execute('SELECT * FROM vehicle_maintenance WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new AppError('Maintenance schedule not found.', 404);
  }

  const maintenance = rows[0];
  const currentStatus = maintenance.status;

  // Validate transitions
  if (status === 'In_Progress' && currentStatus !== 'Scheduled') {
    throw new AppError('Can only start maintenance from Scheduled status.', 400);
  }
  if (status === 'Completed' && !['Scheduled', 'In_Progress'].includes(currentStatus)) {
    throw new AppError('Can only complete maintenance from Scheduled or In_Progress status.', 400);
  }
  if (status === 'Cancelled' && !['Scheduled', 'In_Progress'].includes(currentStatus)) {
    throw new AppError('Can only cancel maintenance from Scheduled or In_Progress status.', 400);
  }

  await pool.execute('UPDATE vehicle_maintenance SET status = ? WHERE id = ?', [status, id]);

  // If completed or cancelled, release the vehicle back to available
  if (status === 'Completed' || status === 'Cancelled') {
    await pool.execute('UPDATE vehicles SET is_available = 1 WHERE id = ?', [maintenance.vehicle_id]);
  }

  // Audit log
  await AuditRepository.createLog(
    req.user.id,
    `MAINTENANCE_${status.toUpperCase()}`,
    'vehicle_maintenance',
    parseInt(id),
    { previous_status: currentStatus, new_status: status, vehicle_id: maintenance.vehicle_id },
    req.ip
  );

  // Fetch vehicle info for response
  const [veh] = await pool.execute('SELECT registration_no FROM vehicles WHERE id = ?', [maintenance.vehicle_id]);
  const regNo = veh[0]?.registration_no || 'Unknown';

  res.json({
    status: 'success',
    message: `Maintenance for ${regNo} updated to ${status.replace('_', ' ')}.`
  });
});

// ─── COMPLETE MAINTENANCE (with record) ───────────────────
exports.completeMaintenance = catchAsync(async (req, res) => {
  const { maintenance_date, cost, description, vendor, invoice_url } = req.body;

  if (!maintenance_date || cost === undefined || !description) {
    throw new AppError('maintenance_date, cost, and description are required.', 400);
  }

  const result = await MaintenanceService.completeMaintenance(req.params.id, {
    maintenance_date,
    cost,
    description,
    vendor,
    invoice_url
  });

  res.json({ status: 'success', ...result });
});

// ─── GET EXPIRING CERTIFICATES ────────────────────────────
exports.getExpiringCertificates = catchAsync(async (req, res) => {
  const alerts = await MaintenanceService.getExpiringCertificates();
  res.json({ status: 'success', data: alerts });
});
