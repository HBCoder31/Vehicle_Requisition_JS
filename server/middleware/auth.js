const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const UserRepository = require('../repositories/UserRepository');
const catchAsync = require('../utils/catchAsync');

exports.authenticate = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.cookies.vrp_token) {
    token = req.cookies.vrp_token;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret');

  // Verify user still exists
  const currentUser = await UserRepository.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  req.user = currentUser;
  next();
});

