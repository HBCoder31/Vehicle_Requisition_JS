const express = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadFile } = require('../controllers/attachmentController');

const router = express.Router();

router.use(authenticate);

router.post('/', uploadFile);

module.exports = router;
