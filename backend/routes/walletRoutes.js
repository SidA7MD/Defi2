const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleGuard');

// All wallet routes require authentication + exclude ADMIN
router.use(authenticate);
router.use(authorize('DONOR', 'VALIDATOR', 'RESTAURANT'));

// GET /api/wallet — get wallet with recent transactions
router.get('/', walletController.getWallet);

// GET /api/wallet/balance — get balance only
router.get('/balance', walletController.getBalance);

// POST /api/wallet/deposit — deposit virtual currency (DONOR & VALIDATOR only)
router.post('/deposit', authorize('DONOR', 'VALIDATOR'), walletController.deposit);

// POST /api/wallet/withdraw — withdraw from wallet (DONOR, VALIDATOR & RESTAURANT)
router.post('/withdraw', walletController.withdraw);

// GET /api/wallet/transactions — get transaction history
router.get('/transactions', walletController.getTransactions);

module.exports = router;
