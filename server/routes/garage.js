const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getPendingAssignments,
  assignVehicle,
  recordPickup,
  recordDropoff,
  getVehicles,
  getActiveTrips,
  getHistory,
  getDrivers,
  updateDriverStatus,
  createVehicle,
  updateVehicle,
  toggleVehicleStatus,
  deleteVehicle,
} = require('../controllers/garageController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Garage: view approved requests pending vehicle assignment
router.get('/pending', authorize('Garage', 'Admin'), getPendingAssignments);

// Garage: assign vehicle + driver
router.patch('/assign/:id', authorize('Garage', 'Admin'), assignVehicle);

// Garage: record pickup (start trip)
router.patch('/pickup/:id', authorize('Garage', 'Admin'), recordPickup);

// Garage: record drop-off (complete trip)
router.patch('/dropoff/:id', authorize('Garage', 'Admin'), recordDropoff);

// Garage/Admin: list all vehicles
router.get('/vehicles', authorize('Garage', 'Admin'), getVehicles);
router.post('/vehicles', authorize('Garage', 'Admin'), createVehicle);
router.put('/vehicles/:id', authorize('Garage', 'Admin'), updateVehicle);
router.patch('/vehicles/:id/status', authorize('Garage', 'Admin'), toggleVehicleStatus);
router.delete('/vehicles/:id', authorize('Garage', 'Admin'), deleteVehicle);

// Garage: view active trips
router.get('/active', authorize('Garage', 'Admin'), getActiveTrips);

// Garage: view history of completed trips
router.get('/history', authorize('Garage', 'Admin'), getHistory);

// Garage: get drivers
router.get('/drivers', authorize('Garage', 'Admin'), getDrivers);

// Garage: update driver leave/active status
router.patch('/drivers/:id/status', authorize('Admin'), updateDriverStatus);

module.exports = router;
