const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getAllLogs,
  addLog
} = require('../controllers/fuelController');

const router = express.Router();

router.use(authenticate);

// CRUD
router.get('/', authorize('Admin', 'Garage', 'COO'), getAllLogs);
router.post('/', authorize('Admin', 'Garage'), addLog);

module.exports = router;
