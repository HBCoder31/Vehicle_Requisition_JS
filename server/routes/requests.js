const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  createRequest,
  getMyRequests,
  exportMyRequests,
  getRequestById,
  deleteRequest,
  getAllRequests,
  getRequestHistory,
  updateRequest,
} = require('../controllers/requestController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Employee: create a new request
router.post('/', authorize('Employee', 'HOD', 'COO', 'Admin'), createRequest);

// Employee: view own requests
router.get('/my', getMyRequests);

// Employee: export own requests as Excel
router.get('/my/export', exportMyRequests);

// Admin: view all requests with pagination
router.get('/all', authorize('Admin'), getAllRequests);

// Any authenticated user (with access check in controller)
router.get('/:id', getRequestById);

// Employee: update request
router.put('/:id', authorize('Employee', 'HOD', 'COO', 'Admin'), updateRequest);

// Employee: delete own pending request
router.patch('/:id/delete', authorize('Employee', 'HOD', 'COO', 'Admin'), deleteRequest);

// Request Timeline History
router.get('/:id/history', getRequestHistory);

module.exports = router;
