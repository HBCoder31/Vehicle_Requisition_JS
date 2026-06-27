const express = require('express');
const {
  handleApprove,
  handleReject,
  handleRejectSubmit
} = require('../controllers/emailApprovalController');

const router = express.Router();

// Public routes for handling email-based approvals/rejections
router.get('/approve/:token', handleApprove);
router.get('/reject/:token', handleReject);
router.post('/reject/:token', handleRejectSubmit);

module.exports = router;
