const { authService } = require('../services');
const { asyncHandler } = require('../utils');
const { auditLogService } = require('../services/auditLogService');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  await auditLogService.log(
    result.user.id,
    'REGISTER',
    'User',
    result.user.id,
    { role: req.body.role, email: req.body.email },
    req.ip
  );

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  await auditLogService.log(
    result.user.id,
    'LOGIN',
    'User',
    result.user.id,
    { email: req.body.email },
    req.ip
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  res.json({
    success: true,
    data: profile,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.body.refreshToken);
  res.json({
    success: true,
    message: 'Token refreshed',
    data: result,
  });
});

const logout = asyncHandler(async (req, res) => {
  if (req.body.refreshToken) {
    await authService.revokeRefreshToken(req.body.refreshToken);
  }
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = { register, login, getProfile, refreshToken, logout };
