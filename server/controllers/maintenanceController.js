const Joi = require('../utils/joiMock');
const MaintenanceService = require('../services/MaintenanceService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const scheduleSchema = Joi.object({
  vehicle_id: Joi.number().integer().required(),
  scheduled_date: Joi.date().iso().required(),
  description: Joi.string().required(),
  status: Joi.string().valid('Scheduled', 'In_Progress', 'Completed', 'Cancelled').default('Scheduled')
});

const completeSchema = Joi.object({
  maintenance_date: Joi.date().iso().required(),
  cost: Joi.number().precision(2).required(),
  description: Joi.string().required(),
  vendor: Joi.string().allow(null, ''),
  invoice_url: Joi.string().allow(null, '')
});

exports.getAllSchedules = catchAsync(async (req, res) => {
  const schedules = await MaintenanceService.getAllSchedules();
  res.json({ status: 'success', data: schedules });
});

exports.scheduleMaintenance = catchAsync(async (req, res) => {
  const { error, value } = scheduleSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const schedule = await MaintenanceService.scheduleMaintenance(value, req.user.id);
  res.status(201).json({ status: 'success', data: schedule });
});

exports.completeMaintenance = catchAsync(async (req, res) => {
  const { error, value } = completeSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const result = await MaintenanceService.completeMaintenance(req.params.id, value);
  res.json({ status: 'success', ...result });
});

exports.getExpiringCertificates = catchAsync(async (req, res) => {
  const alerts = await MaintenanceService.getExpiringCertificates();
  res.json({ status: 'success', data: alerts });
});
