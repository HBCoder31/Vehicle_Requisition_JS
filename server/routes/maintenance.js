const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getAllSchedules,
  scheduleMaintenance,
  completeMaintenance,
  getExpiringCertificates
} = require('../controllers/maintenanceController');

const router = express.Router();

router.use(authenticate);

// Alerts (must come before /:id)
router.get('/alerts/certificates', authorize('Admin', 'Garage'), getExpiringCertificates);

// CRUD
router.get('/', authorize('Admin', 'Garage', 'COO'), getAllSchedules);
router.post('/', authorize('Admin', 'Garage'), scheduleMaintenance);
router.post('/:id/complete', authorize('Admin', 'Garage'), completeMaintenance);

module.exports = router;
