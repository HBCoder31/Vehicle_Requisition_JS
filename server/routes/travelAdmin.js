const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getPending,
  getHistory,
  bookTicket,
  requestClarification
} = require('../controllers/travelAdminController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Authorize 'Travel Admin' and 'Admin' roles
router.get('/pending', authorize('Travel Admin', 'Admin'), getPending);
router.get('/history', authorize('Travel Admin', 'Admin'), getHistory);
router.patch('/book/:id', authorize('Travel Admin', 'Admin'), bookTicket);
router.patch('/clarification/:id', authorize('Travel Admin', 'Admin'), requestClarification);

module.exports = router;
