const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

router.use(authMiddleware);
// Booking routes
router.post('/', bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.get('/:id', bookingController.getOneBooking);
router.post('/:id/addons', bookingController.attachAddons);

module.exports = router;