const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getPendingExits,
  getPendingEntries,
  recordExit,
  recordEntry,
  getEmployeeTravelHistory,
  getTravelCosts,
  updateTravelCost,
  getEmployeeBalances,
  getPaymentHistory,
  recordPayment,
  getBillDetails,
  logBillGeneration,
  getGarageFleetStatus,
  getAnalytics
} = require('../controllers/phase2Controller');

const router = express.Router();

// All phase2 routes require authentication
router.use(authenticate);

// Security Gate routes (Security Guard, Admin)
router.get('/gate/exits', authorize('Security Guard', 'Admin'), getPendingExits);
router.get('/gate/entries', authorize('Security Guard', 'Admin'), getPendingEntries);
router.post('/gate/exit', authorize('Security Guard', 'Admin'), recordExit);
router.post('/gate/entry', authorize('Security Guard', 'Admin'), recordEntry);

// Travel History route (Any authenticated user can view history, query filtering handled in controller)
router.get('/travel-history', getEmployeeTravelHistory);

// Rates routes
router.get('/rates', getTravelCosts);
router.post('/rates', authorize('Admin'), updateTravelCost);

// Payments routes
router.get('/balances', authorize('Admin'), getEmployeeBalances);
router.get('/payments/:employeeId', getPaymentHistory); // Admin or the employee themselves (restriction handled or allowed for simplicity)
router.post('/payments', authorize('Admin'), recordPayment);

// Billing routes
router.get('/bill/:tripLogId', getBillDetails);
router.post('/bill/log', logBillGeneration);

// Garage routes
router.get('/garage/status', authorize('Garage', 'Admin'), getGarageFleetStatus);

// Analytics routes
router.get('/analytics', authorize('HOD', 'GM-HR', 'COO', 'Admin'), getAnalytics);

module.exports = router;
