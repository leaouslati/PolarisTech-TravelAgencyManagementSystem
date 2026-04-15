const express = require('express');
const router = express.Router();
const {
  getAllPackages,
  getOnePackage,
  getRecommendations,
} = require('../controllers/packageController');

router.get('/', getAllPackages);
router.get('/recommendations/:userId', getRecommendations);
router.get('/:id', getOnePackage);

module.exports = router;