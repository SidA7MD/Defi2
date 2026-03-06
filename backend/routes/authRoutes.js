const express = require('express');
const router = express.Router();
const { register, login, getProfile, refreshToken, logout, updateProfile, updateSettings, changePassword, getActivities } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { registerRules, loginRules, refreshTokenRules, validate } = require('../middlewares/validators');

// Public
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/refresh', refreshTokenRules, validate, refreshToken);
router.post('/logout', logout);

// Protected
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.patch('/settings', authenticate, updateSettings);
router.patch('/password', authenticate, changePassword);
router.get('/activities', authenticate, getActivities);

module.exports = router;
