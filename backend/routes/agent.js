const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const agentController = require('../controllers/agentController');

// All agent routes require authentication and TravelAgent role
router.use(authMiddleware);
router.use(roleMiddleware('TravelAgent'));

// Package routes
router.get('/packages', agentController.getAgentPackages);
router.post('/packages', agentController.createPackage);
router.put('/packages/:id', agentController.updatePackage);
router.delete('/packages/:id', agentController.deletePackage);

// Destinations (for package form dropdown)
router.get('/destinations', agentController.getDestinations);

// Booking routes
router.get('/bookings', agentController.getAgentBookings);
router.patch('/bookings/:bookingId/approve', agentController.approveBooking);
router.patch('/bookings/:bookingId/decline', agentController.declineBooking);

// Cancellation routes
router.get('/cancellations', agentController.getCancellationRequests);
router.patch('/cancellations/:cancelId/approve', agentController.approveCancellation);
router.patch('/cancellations/:cancelId/reject', agentController.rejectCancellation);

// Messaging routes
router.post('/messages/:bookingId', agentController.sendMessage);
router.get('/messages/:bookingId', agentController.getMessages);

// Notifications
router.get('/notifications', agentController.getNotifications);

module.exports = router;
