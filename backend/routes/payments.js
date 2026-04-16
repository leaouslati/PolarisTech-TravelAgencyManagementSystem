const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

router.use(authMiddleware);

router.post('/', bookingController.processPayment);

module.exports = router;