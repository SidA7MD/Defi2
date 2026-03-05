const { donationService } = require('../services');
const { asyncHandler } = require('../utils');

const createDonation = asyncHandler(async (req, res) => {
  const result = await donationService.createDonation(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Donation created successfully',
    data: result,
  });
});

const getDonorDonations = asyncHandler(async (req, res) => {
  const donations = await donationService.getDonorDonations(req.user.id);
  res.json({
    success: true,
    data: donations,
    count: donations.length,
  });
});

const getDonationById = asyncHandler(async (req, res) => {
  const donation = await donationService.getDonationById(req.params.id);
  res.json({
    success: true,
    data: donation,
  });
});

const verifyTransaction = asyncHandler(async (req, res) => {
  const result = await donationService.verifyTransaction(req.params.transactionHash);
  res.json({
    success: true,
    data: result,
  });
});

const getPublicDashboard = asyncHandler(async (req, res) => {
  const transactions = await donationService.getPublicDashboard();
  res.json({
    success: true,
    data: transactions,
    count: transactions.length,
  });
});

const getConfirmedDonations = asyncHandler(async (req, res) => {
  const transactions = await donationService.getConfirmedDonations();
  res.json({
    success: true,
    data: transactions,
    count: transactions.length,
  });
});

const getDonorStats = asyncHandler(async (req, res) => {
  const result = await donationService.getDonorStats(req.user.id);
  res.json({
    success: true,
    data: result,
  });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const result = await donationService.getDashboardStats();
  res.json({
    success: true,
    data: result,
  });
});

module.exports = {
  createDonation,
  getDonorDonations,
  getDonationById,
  verifyTransaction,
  getPublicDashboard,
  getConfirmedDonations,
  getDonorStats,
  getDashboardStats,
};
