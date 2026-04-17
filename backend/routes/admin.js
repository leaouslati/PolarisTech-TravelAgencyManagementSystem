const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.use(authMiddleware);
router.use(roleMiddleware('Administrator'));

/* -------------------- Day 1: Users -------------------- */
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getOneUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

/* -------------------- Day 2: Monitoring / Reports / Package Updates -------------------- */
router.get('/bookings', adminController.getAllBookings);
router.get('/packages', adminController.getAllPackages);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/package-updates', adminController.getPendingPackageUpdates);
router.patch('/package-updates/:updateId/approve', adminController.approvePackageUpdate);
router.patch('/package-updates/:updateId/reject', adminController.rejectPackageUpdate);

module.exports = router;