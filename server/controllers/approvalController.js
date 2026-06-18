const Joi = require('../utils/joiMock');
const ApprovalService = require('../services/ApprovalService');
const delegationUtil = require('../utils/delegationUtil');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const actionSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  remarks: Joi.string().allow('', null)
});

// ─── HOD ──────────────────────────────────────────────

exports.getHodPendingRequests = catchAsync(async (req, res) => {
  const { roles, departmentIds } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('HOD')) throw new AppError('Access denied.', 403);

  const requests = await ApprovalService.getHodPendingRequests(departmentIds);
  res.json({ status: 'success', requests });
});

exports.hodAction = catchAsync(async (req, res) => {
  const { error, value } = actionSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { roles, departmentIds } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('HOD')) throw new AppError('Access denied.', 403);

  const newStatus = await ApprovalService.hodAction(
    req.params.id, 
    departmentIds, 
    value.action, 
    value.remarks, 
    req.user.id, 
    req.ip
  );

  res.json({ status: 'success', message: `Request ${value.action}d by HOD.`, newStatus });
});

exports.getHodStats = catchAsync(async (req, res) => {
  const { roles, departmentIds } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('HOD')) throw new AppError('Access denied.', 403);

  const stats = await ApprovalService.getHodStats(departmentIds);
  res.json({ status: 'success', stats });
});

// ─── GM-HR ──────────────────────────────────────────────

exports.getGmHrPendingRequests = catchAsync(async (req, res) => {
  const { roles } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('GM-HR')) throw new AppError('Access denied.', 403);

  const requests = await ApprovalService.getGmHrPendingRequests();
  res.json({ status: 'success', requests });
});

exports.gmHrAction = catchAsync(async (req, res) => {
  const { error, value } = actionSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { roles } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('GM-HR')) throw new AppError('Access denied.', 403);

  const newStatus = await ApprovalService.gmHrAction(
    req.params.id, 
    value.action, 
    value.remarks, 
    req.user.id, 
    req.ip
  );

  res.json({ status: 'success', message: `Request ${value.action}d by GM-HR.`, newStatus });
});

exports.getGmHrStats = catchAsync(async (req, res) => {
  const { roles } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('GM-HR')) throw new AppError('Access denied.', 403);

  const stats = await ApprovalService.getGmHrStats();
  res.json({ status: 'success', stats });
});

// ─── COO ──────────────────────────────────────────────

exports.getCooPendingRequests = catchAsync(async (req, res) => {
  const { roles } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('COO')) throw new AppError('Access denied.', 403);

  const requests = await ApprovalService.getCooPendingRequests();
  res.json({ status: 'success', requests });
});

exports.cooAction = catchAsync(async (req, res) => {
  const { error, value } = actionSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { roles } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('COO')) throw new AppError('Access denied.', 403);

  const newStatus = await ApprovalService.cooAction(
    req.params.id, 
    value.action, 
    value.remarks, 
    req.user.id, 
    req.ip
  );

  res.json({ status: 'success', message: `Request ${value.action}d by COO.`, newStatus });
});

exports.getHodHistory = catchAsync(async (req, res) => {
  const { roles } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('HOD')) throw new AppError('Access denied.', 403);

  const requests = await ApprovalService.getHodHistory(req.user.id);
  res.json({ status: 'success', requests });
});

exports.getCooHistory = catchAsync(async (req, res) => {
  const { roles } = await delegationUtil.getEffectivePermissions(req.user.id);
  if (!roles.includes('COO')) throw new AppError('Access denied.', 403);

  const requests = await ApprovalService.getCooHistory(req.user.id);
  res.json({ status: 'success', requests });
});
