const { walletService } = require('../services');
const { asyncHandler } = require('../utils');

const getWallet = asyncHandler(async (req, res) => {
  const result = await walletService.getWallet(req.user.id);
  res.json({
    success: true,
    data: result,
  });
});

const getBalance = asyncHandler(async (req, res) => {
  const result = await walletService.getBalance(req.user.id);
  res.json({
    success: true,
    data: result,
  });
});

const deposit = asyncHandler(async (req, res) => {
  const result = await walletService.deposit(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Deposit successful',
    data: result,
  });
});

const withdraw = asyncHandler(async (req, res) => {
  const result = await walletService.withdraw(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Withdrawal successful',
    data: result,
  });
});

const getTransactions = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const transactions = await walletService.getTransactions(req.user.id, limit);
  res.json({
    success: true,
    data: transactions,
    count: transactions.length,
  });
});

module.exports = {
  getWallet,
  getBalance,
  deposit,
  withdraw,
  getTransactions,
};
