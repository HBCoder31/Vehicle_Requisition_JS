const express = require('express');
const {
  handleApproveForm,
  handleApproveSubmit,
  handleReject,
  handleRejectSubmit
} = require('../controllers/emailApprovalController');

const router = express.Router();

// Public routes for handling email-based approvals/rejections
router.get('/approve/:token', handleApproveForm);
router.post('/approve/:token', handleApproveSubmit);
router.get('/reject/:token', handleReject);
router.post('/reject/:token', handleRejectSubmit);

module.exports = router;
