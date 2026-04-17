const express = require('express');
const router = express.Router();
const {
  getAllPackages,
  getOnePackage,
  getRecommendations,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} = require('../controllers/packageController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/', getAllPackages);
router.get('/recommendations/:userId', getRecommendations);
router.get('/:id', getOnePackage);

// Wishlist routes
router.post('/wishlist', authMiddleware, roleMiddleware('Customer'), addToWishlist);
router.delete('/wishlist/:packageId', authMiddleware, removeFromWishlist);
router.get('/wishlist', authMiddleware, getWishlist);

module.exports = router;