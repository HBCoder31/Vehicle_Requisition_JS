const express = require('express');
const { authenticate } = require('../middleware/auth');
const { submitFeedback, getRequestFeedback, getAllDriverFeedbacks } = require('../controllers/feedbackController');

const router = express.Router();

router.use(authenticate);

// Request-specific feedback endpoints
router.post('/:id/feedback', submitFeedback);
router.get('/:id/feedback', getRequestFeedback);

// Garage list endpoint
router.get('/all/garage', getAllDriverFeedbacks);

module.exports = router;
