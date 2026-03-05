const express = require('express');
const router = express.Router();
const {
    createUser,
    approveUser,
    getAllUsers,
    getPendingUsers,
    deleteUser,
    toggleUserStatus,
    getSystemStats,
    getAuditLog,
    getAllNeeds,
    deleteNeed,
    updateNeedStatus,
    getAllDonations,
    getFlaggedDonations,
    toggleDonationFlag,
    deleteDonation,
} = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/roleGuard');

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// System overview
router.get('/stats', getSystemStats);
router.get('/audit-log', getAuditLog);

// User management
router.get('/users', getAllUsers);
router.get('/users/pending', getPendingUsers);
router.post('/users', createUser);
router.patch('/users/:userId/approve', approveUser);
router.patch('/users/:userId/toggle-status', toggleUserStatus);
router.delete('/users/:userId', deleteUser);

// Need management
router.get('/needs', getAllNeeds);
router.patch('/needs/:needId/status', updateNeedStatus);
router.delete('/needs/:needId', deleteNeed);

// Donation management
router.get('/donations', getAllDonations);
router.get('/donations/flagged', getFlaggedDonations);
router.patch('/donations/:donationId/toggle-flag', toggleDonationFlag);
router.delete('/donations/:donationId', deleteDonation);

module.exports = router;
