const Joi = require('../utils/joiMock');
const DriverService = require('../services/DriverService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const driverSchema = Joi.object({
  full_name: Joi.string().required(),
  employee_number: Joi.string().required(),
  email: Joi.string().email().allow(null, ''),
  phone: Joi.string().allow(null, ''),
  license_number: Joi.string().allow(null, ''),
  license_expiry: Joi.date().iso().allow(null, ''),
  is_active: Joi.boolean().default(true),
  campus_id: Joi.number().integer().allow(null)
});

exports.getAllDrivers = catchAsync(async (req, res) => {
  const drivers = await DriverService.getAllDrivers();
  res.json({ status: 'success', data: drivers });
});

exports.getDriver = catchAsync(async (req, res) => {
  const driver = await DriverService.getDriver(req.params.id);
  res.json({ status: 'success', data: driver });
});

exports.createDriver = catchAsync(async (req, res) => {
  const { error, value } = driverSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const driver = await DriverService.createDriver(value);
  res.status(201).json({ status: 'success', data: driver });
});

exports.updateDriver = catchAsync(async (req, res) => {
  const { error, value } = driverSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const driver = await DriverService.updateDriver(req.params.id, value);
  res.json({ status: 'success', data: driver });
});

exports.getExpiringLicenses = catchAsync(async (req, res) => {
  const alerts = await DriverService.getExpiringLicenses();
  res.json({ status: 'success', data: alerts });
});
