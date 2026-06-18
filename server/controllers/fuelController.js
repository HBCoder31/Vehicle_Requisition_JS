const Joi = require('../utils/joiMock');
const FuelService = require('../services/FuelService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const fuelSchema = Joi.object({
  vehicle_id: Joi.number().integer().required(),
  driver_id: Joi.number().integer().allow(null),
  log_date: Joi.date().iso().required(),
  liters: Joi.number().precision(2).required(),
  cost: Joi.number().precision(2).required(),
  odometer_reading: Joi.number().integer().required(),
  receipt_url: Joi.string().allow(null, '')
});

exports.getAllLogs = catchAsync(async (req, res) => {
  const logs = await FuelService.getAllLogs();
  res.json({ status: 'success', data: logs });
});

exports.addLog = catchAsync(async (req, res) => {
  const { error, value } = fuelSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const log = await FuelService.addLog(value, req.user.id, req.ip);
  res.status(201).json({ status: 'success', data: log });
});
