const express = require('express');
const router = express.Router();
const {
  createImpactProof,
  getProofByDonationId,
} = require('../controllers/impactProofController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleGuard');
const { createImpactProofRules, validate } = require('../middlewares/validators');

router.post(
  '/',
  authenticate,
  authorize('VALIDATOR', 'ADMIN'),
  createImpactProofRules,
  validate,
  createImpactProof
);

router.get('/:donationId', authenticate, getProofByDonationId);

module.exports = router;
