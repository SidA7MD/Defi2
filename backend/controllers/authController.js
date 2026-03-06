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

const updateProfile = asyncHandler(async (req, res) => {
  const updated = await authService.updateProfile(req.user.id, req.body);

  await auditLogService.log(
    req.user.id,
    'UPDATE_PROFILE',
    'User',
    req.user.id,
    { fields: Object.keys(req.body) },
    req.ip
  );

  res.json({
    success: true,
    message: 'Profile updated',
    data: updated,
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updated = await authService.updateSettings(req.user.id, req.body);

  await auditLogService.log(
    req.user.id,
    'UPDATE_SETTINGS',
    'User',
    req.user.id,
    { fields: Object.keys(req.body) },
    req.ip
  );

  res.json({
    success: true,
    message: 'Settings updated',
    data: updated,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);

  await auditLogService.log(
    req.user.id,
    'CHANGE_PASSWORD',
    'User',
    req.user.id,
    {},
    req.ip
  );

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

const getActivities = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const activities = await auditLogService.getByActor(req.user.id, limit);

  // Transform activities to be more user-friendly
  const transformedActivities = activities.map(activity => ({
    id: activity.id,
    action: activity.action,
    entityType: activity.entityType,
    entityId: activity.entityId,
    metadata: activity.metadata ? JSON.parse(activity.metadata) : {},
    createdAt: activity.createdAt,
  }));

  res.json({
    success: true,
    data: transformedActivities,
  });
});

module.exports = { register, login, getProfile, refreshToken, logout, updateProfile, updateSettings, changePassword, getActivities };
