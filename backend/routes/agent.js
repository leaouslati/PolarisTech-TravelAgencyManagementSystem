const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
router.use(authMiddleware);
router.use(roleMiddleware('TravelAgent'));
router.get('/packages', agentController.getPackages);
router.post('/packages', agentController.createPackage);
router.put('/packages/:packageId', agentController.updatePackage);
router.delete('/packages/:packageId', agentController.deletePackage);
router.get('/bookings', agentController.getBookings);
router.patch('/bookings/:bookingId/approve', agentController.approveBooking);
router.patch('/bookings/:bookingId/decline', agentController.declineBooking);

module.exports = router;