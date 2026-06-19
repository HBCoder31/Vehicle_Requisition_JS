const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getHodPendingRequests,
  hodAction,
  getHodStats,
  getCooPendingRequests,
  cooAction,
  getGmHrPendingRequests,
  gmHrAction,
  getGmHrStats,
  getGmHrHistory,
  getHodHistory,
  getCooHistory
} = require('../controllers/approvalController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ─── HOD Routes ────────────────────────────────────────────
router.get('/hod', authorize('HOD', 'Admin'), getHodPendingRequests);
router.get('/hod/stats', authorize('HOD', 'Admin'), getHodStats);
router.get('/hod/history', authorize('HOD', 'Admin'), getHodHistory);
router.patch('/hod/:id', authorize('HOD', 'Admin'), hodAction);

// ─── COO Routes ────────────────────────────────────────────
router.get('/coo', authorize('COO', 'Admin'), getCooPendingRequests);
router.get('/coo/history', authorize('COO', 'Admin'), getCooHistory);
router.patch('/coo/:id', authorize('COO', 'Admin'), cooAction);

// ─── GM-HR Routes ──────────────────────────────────────────
router.get('/gmhr', authorize('GM-HR', 'Admin'), getGmHrPendingRequests);
router.get('/gmhr/stats', authorize('GM-HR', 'Admin'), getGmHrStats);
router.get('/gmhr/history', authorize('GM-HR', 'Admin'), getGmHrHistory);
router.patch('/gmhr/:id', authorize('GM-HR', 'Admin'), gmHrAction);

module.exports = router;
