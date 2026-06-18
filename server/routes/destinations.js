const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getAllDestinations,
  createDestination,
  updateDestination,
  toggleDestinationStatus,
  deleteDestination
} = require('../controllers/destinationController');

const router = express.Router();

router.use(authenticate);

// List destinations (accessible to all authenticated users)
router.get('/', getAllDestinations);

// CRUD (Admin only)
router.post('/', authorize('Admin'), createDestination);
router.put('/:id', authorize('Admin'), updateDestination);
router.patch('/:id/status', authorize('Admin'), toggleDestinationStatus);
router.delete('/:id', authorize('Admin'), deleteDestination);

module.exports = router;
