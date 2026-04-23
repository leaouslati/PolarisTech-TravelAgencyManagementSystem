const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const agentController = require('../controllers/agentController');

router.use(authMiddleware);
router.use(roleMiddleware('TravelAgent'));

// Package management
router.get('/packages',           agentController.getAgentPackages);
router.post('/packages',          agentController.createPackage);
router.put('/packages/:id',       agentController.updatePackage);
router.delete('/packages/:id',    agentController.deletePackage);

// Destinations (dropdown data for package form)
router.get('/destinations',       agentController.getDestinations);
router.get('/hotels',             agentController.getHotels);
router.get('/flights',            agentController.getFlights);
router.get('/tours',              agentController.getTours);

// Booking requests
router.get('/bookings',                          agentController.getAgentBookings);
router.patch('/bookings/:bookingId/approve',     agentController.approveBooking);
router.patch('/bookings/:bookingId/decline',     agentController.declineBooking);

// Cancellations
router.get('/cancellations',                          agentController.getCancellationRequests);
router.patch('/cancellations/:cancelId/approve',      agentController.approveCancellation);
router.patch('/cancellations/:cancelId/reject',       agentController.rejectCancellation);

// Messaging
router.post('/messages/:bookingId',  agentController.sendMessage);
router.get('/messages/:bookingId',   agentController.getMessages);

// Notifications
router.get('/notifications',         agentController.getNotifications);

module.exports = router;
