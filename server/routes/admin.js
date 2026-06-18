const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAuditLogs,
  getDashboardStats,
  getDepartments,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require Admin role
router.use(authenticate);
router.use(authorize('Admin'));

// Dashboard stats
router.get('/dashboard', getDashboardStats);

// Employee CRUD
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Departments
router.get('/departments', getDepartments);

module.exports = router;
