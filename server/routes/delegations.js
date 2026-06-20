const express = require('express');
const router = express.Router();
const delegationController = require('../controllers/delegationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All delegation routes require authentication and authorization
router.use(authenticate);
router.use(authorize('Admin', 'HOD', 'COO', 'GM-HR', 'Garage'));

router.get('/', delegationController.getDelegations);
router.post('/', delegationController.createDelegation);
router.get('/eligible-users', delegationController.getEligibleUsers);
router.patch('/:id/cancel', delegationController.cancelDelegation);

module.exports = router;
