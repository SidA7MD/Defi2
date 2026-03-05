const { impactProofService } = require('../services');
const { asyncHandler } = require('../utils');

const createImpactProof = asyncHandler(async (req, res) => {
  const proof = await impactProofService.createImpactProof(req.user.id, {
    donationId: req.body.donationId,
    confirmationMessage: req.body.confirmationMessage,
    photoUrl: req.body.photoUrl || null,
  });
  res.status(201).json({
    success: true,
    message: 'Impact proof submitted and donation confirmed',
    data: proof,
  });
});

const getProofByDonationId = asyncHandler(async (req, res) => {
  const proof = await impactProofService.getProofByDonationId(req.params.donationId);
  res.json({
    success: true,
    data: proof,
  });
});

module.exports = { createImpactProof, getProofByDonationId };
