const FeedbackRepository = require('../repositories/FeedbackRepository');
const RequestRepository = require('../repositories/RequestRepository');
const AuditRepository = require('../repositories/AuditRepository');
const HistoryRepository = require('../repositories/HistoryRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.submitFeedback = catchAsync(async (req, res, next) => {
  const { rating, comments } = req.body;
  const requestId = parseInt(req.params.id, 10);

  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError('Rating must be an integer between 1 and 5.', 400));
  }

  const request = await RequestRepository.getRequestById(requestId);
  if (!request) {
    return next(new AppError('Request not found.', 404));
  }

  // Only the person who made the requisition (or did the trip) can submit feedback
  if (request.employee_id !== req.user.id) {
    return next(new AppError('Only the requester can submit driver feedback.', 403));
  }

  // Requisitions must be Completed to allow feedback
  if (request.status !== 'Completed') {
    return next(new AppError('Feedback can only be submitted for completed trips.', 400));
  }

  if (!request.assigned_driver_id) {
    return next(new AppError('No driver was assigned to this trip.', 400));
  }

  // Check if feedback already submitted
  const existingFeedback = await FeedbackRepository.getFeedbackByRequestId(requestId);
  if (existingFeedback) {
    return next(new AppError('Feedback has already been submitted for this trip.', 400));
  }

  const feedbackId = await FeedbackRepository.createFeedback(
    requestId,
    request.assigned_driver_id,
    req.user.id,
    rating,
    comments
  );

  // Timeline entry
  await HistoryRepository.addEvent(
    requestId,
    req.user.id,
    'Feedback_Submitted',
    'Completed',
    'Completed',
    `Driver feedback submitted. Rating: ${rating}/5.`
  );

  // Audit Log entry
  await AuditRepository.createLog(
    req.user.id,
    'SUBMIT_DRIVER_FEEDBACK',
    'vehicle_request',
    requestId,
    { rating, comments },
    req.ip
  );

  res.status(211).json({
    status: 'success',
    message: 'Feedback submitted successfully.',
    data: { feedbackId }
  });
});

exports.getRequestFeedback = catchAsync(async (req, res, next) => {
  const requestId = parseInt(req.params.id, 10);
  const request = await RequestRepository.getRequestById(requestId);
  if (!request) {
    return next(new AppError('Request not found.', 404));
  }

  // Access Control: requester, Garage, Admin
  const isOwner = request.employee_id === req.user.id;
  const isAuthorizedRole = ['Garage', 'Admin'].includes(req.user.role);

  if (!isOwner && !isAuthorizedRole) {
    return next(new AppError('Access denied.', 403));
  }

  const feedback = await FeedbackRepository.getFeedbackByRequestId(requestId);
  res.json({
    status: 'success',
    data: feedback
  });
});

exports.getAllDriverFeedbacks = catchAsync(async (req, res, next) => {
  // Only Garage and Admin can access this
  if (!['Garage', 'Admin'].includes(req.user.role)) {
    return next(new AppError('Access denied.', 403));
  }

  const feedbacks = await FeedbackRepository.getAllFeedbacks();
  res.json({
    status: 'success',
    data: feedbacks
  });
});
