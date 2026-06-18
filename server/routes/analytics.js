const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { getDashboardMetrics, exportRequests } = require('../controllers/analyticsController');


const router = express.Router();

router.use(authenticate);
router.use(authorize('Admin', 'COO')); // Only Admin and COO get full analytics access

router.get('/metrics', getDashboardMetrics);
router.get('/export', exportRequests);

module.exports = router;
