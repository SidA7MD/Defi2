const express = require('express');
const router = express.Router();
const {
  createNeed,
  getNeeds,
  getNeedById,
  updateNeedStatus,
  getValidatorNeeds,
  getValidatorStats,
  getRestaurantNeeds,
  confirmByRestaurant,
} = require('../controllers/needController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleGuard');
const { createNeedRules, validate } = require('../middlewares/validators');

// Public routes
router.get('/', getNeeds);
router.get('/validator/mine', authenticate, authorize('VALIDATOR'), getValidatorNeeds);
router.get('/validator/mine/stats', authenticate, authorize('VALIDATOR'), getValidatorStats);
router.get('/restaurant/mine', authenticate, authorize('RESTAURANT'), getRestaurantNeeds);
router.patch('/:id/confirm', authenticate, authorize('RESTAURANT'), confirmByRestaurant);
router.get('/:id', getNeedById);

// Validator routes
router.post('/', authenticate, authorize('VALIDATOR', 'ADMIN'), createNeedRules, validate, createNeed);
router.patch('/:id/status', authenticate, authorize('VALIDATOR', 'ADMIN'), updateNeedStatus);

module.exports = router;
