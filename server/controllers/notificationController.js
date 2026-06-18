const NotificationService = require('../services/NotificationService');
const catchAsync = require('../utils/catchAsync');

exports.getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await NotificationService.getMyNotifications(req.user.id);
  res.json({ status: 'success', data: notifications });
});

exports.markAsRead = catchAsync(async (req, res) => {
  await NotificationService.markAsRead(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Notification marked as read' });
});

exports.markAllAsRead = catchAsync(async (req, res) => {
  await NotificationService.markAllAsRead(req.user.id);
  res.json({ status: 'success', message: 'All notifications marked as read' });
});
