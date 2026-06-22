const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getAllSchedules,
  getAvailableVehicles,
  scheduleMaintenance,
  updateMaintenanceStatus,
  completeMaintenance,
  getExpiringCertificates
} = require('../controllers/maintenanceController');

const router = express.Router();

router.use(authenticate);

// Alerts (must come before /:id)
router.get('/alerts/certificates', authorize('Admin', 'Garage'), getExpiringCertificates);

// Available vehicles for maintenance scheduling
router.get('/available-vehicles', authorize('Admin', 'Garage'), getAvailableVehicles);

// CRUD
router.get('/', authorize('Admin', 'Garage', 'COO'), getAllSchedules);
router.post('/', authorize('Admin', 'Garage'), scheduleMaintenance);
router.patch('/:id/status', authorize('Admin', 'Garage'), updateMaintenanceStatus);
router.post('/:id/complete', authorize('Admin', 'Garage'), completeMaintenance);

module.exports = router;
