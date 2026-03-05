const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonorDonations,
  getDonationById,
  verifyTransaction,
  getPublicDashboard,
  getConfirmedDonations,
  getDonorStats,
  getDashboardStats,
} = require('../controllers/donationController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleGuard');
const { createDonationRules, validate } = require('../middlewares/validators');

// Public routes
router.get('/dashboard', getPublicDashboard);
router.get('/dashboard/stats', getDashboardStats);
router.get('/confirmed', getConfirmedDonations);
router.get('/verify/:transactionHash', verifyTransaction);

// Donor routes
router.post('/', authenticate, authorize('DONOR', 'ADMIN'), createDonationRules, validate, createDonation);
router.get('/mine', authenticate, getDonorDonations);
router.get('/mine/stats', authenticate, getDonorStats);
router.get('/:id', authenticate, getDonationById);

module.exports = router;
