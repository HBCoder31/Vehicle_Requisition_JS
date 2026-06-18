const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getAllDrivers,
  getDriver,
  createDriver,
  updateDriver,
  getExpiringLicenses
} = require('../controllers/driverController');

const router = express.Router();

router.use(authenticate);

// Alerts (must come before /:id)
router.get('/alerts/licenses', authorize('Admin', 'Garage'), getExpiringLicenses);

// CRUD
router.get('/', authorize('Admin', 'Garage', 'COO', 'HOD'), getAllDrivers);
router.post('/', authorize('Admin', 'Garage'), createDriver);
router.get('/:id', authorize('Admin', 'Garage', 'COO', 'HOD'), getDriver);
router.put('/:id', authorize('Admin', 'Garage'), updateDriver);

module.exports = router;
