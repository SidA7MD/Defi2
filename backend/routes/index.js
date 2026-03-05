const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const needRoutes = require('./needRoutes');
const donationRoutes = require('./donationRoutes');
const impactProofRoutes = require('./impactProofRoutes');
const restaurantRoutes = require('./restaurantRoutes');
const walletRoutes = require('./walletRoutes');
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/needs', needRoutes);
router.use('/donations', donationRoutes);
router.use('/impact-proofs', impactProofRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/wallet', walletRoutes);
router.use('/admin', adminRoutes);

// Verification endpoint shortcut
router.get('/verify/:transactionHash', (req, res, next) => {
  req.url = `/donations/verify/${req.params.transactionHash}`;
  router.handle(req, res, next);
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IHSAN API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
