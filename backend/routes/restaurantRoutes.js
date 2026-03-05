const express = require('express');
const router = express.Router();
const { getAllRestaurants, getMyRestaurant, getMyStats } = require('../controllers/restaurantController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleGuard');

router.get('/', getAllRestaurants);
router.get('/mine', authenticate, authorize('RESTAURANT'), getMyRestaurant);
router.get('/mine/stats', authenticate, authorize('RESTAURANT'), getMyStats);

module.exports = router;
