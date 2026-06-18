const express = require('express');
const { authenticate } = require('../middleware/auth');
const { login, forgotPassword, getMe, logout } = require('../controllers/authController');

const router = express.Router();

// ─── Custom Login ──────────────────────────────────────────
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// ─── Session Management ────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the current authenticated user from the JWT cookie.
 * Used by the frontend to restore session on page refresh.
 */
router.get('/me', authenticate, getMe);

/**
 * POST /api/auth/logout
 * Clears the JWT cookie and logs the user out.
 */
router.post('/logout', authenticate, logout);

module.exports = router;
