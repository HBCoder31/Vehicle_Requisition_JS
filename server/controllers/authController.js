const Joi = require('../utils/joiMock');
const AuthService = require('../services/AuthService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const registerSchema = Joi.object({
  employee_number: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().required(),
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required(),
});

const isProd = process.env.NODE_ENV === 'production' || (process.env.CLIENT_URL && process.env.CLIENT_URL.startsWith('https'));

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 min
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new employee
 *     tags: [Auth]
 */
exports.register = catchAsync(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { user, accessToken, refreshToken } = await AuthService.register(value, req.ip);

  setCookies(res, accessToken, refreshToken);

  res.status(201).json({ status: 'success', user });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 */
exports.login = catchAsync(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { user, accessToken, refreshToken } = await AuthService.login(value.identifier, value.password, req.ip);

  setCookies(res, accessToken, refreshToken);

  res.json({ status: 'success', user });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Auth]
 */
exports.refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const tokens = await AuthService.refreshTokens(refreshToken, req.ip);
  
  setCookies(res, tokens.accessToken, tokens.refreshToken);

  res.json({ status: 'success', message: 'Token refreshed' });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 */
exports.logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await AuthService.logout(refreshToken, req.user?.id, req.ip);
  }
  
  res.clearCookie('jwt');
  res.clearCookie('refreshToken');
  
  res.json({ status: 'success', message: 'Logged out successfully' });
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 */
exports.forgotPassword = catchAsync(async (req, res) => {
  if (!req.body.email) throw new AppError('Please provide an email', 400);
  await AuthService.forgotPassword(req.body.email);
  res.json({ status: 'success', message: 'If email exists, reset link sent.' });
});

exports.getMe = catchAsync(async (req, res) => {
  res.json({ status: 'success', user: req.user });
});
