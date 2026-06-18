const express = require('express');
const router = express.Router();
const delegationController = require('../controllers/delegationController');
const { authenticate } = require('../middleware/auth');

// All delegation routes require authentication
router.use(authenticate);

// HOD, COO, GM-HR and Admin are generally the ones delegating, but any employee might need it depending on company policy.
// We'll allow all employees for now, or restrict if needed.
router.get('/', delegationController.getDelegations);
router.post('/', delegationController.createDelegation);
router.get('/eligible-users', delegationController.getEligibleUsers);
router.patch('/:id/cancel', delegationController.cancelDelegation);

module.exports = router;
