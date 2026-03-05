const { authenticate, optionalAuth } = require('./auth');
const { authorize } = require('./roleGuard');
const { errorHandler } = require('./errorHandler');
const {
  validate,
  registerRules,
  loginRules,
  createPrivilegedUserRules,
  createNeedRules,
  createDonationRules,
  createImpactProofRules,
  refreshTokenRules,
} = require('./validators');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  errorHandler,
  validate,
  registerRules,
  loginRules,
  createPrivilegedUserRules,
  createNeedRules,
  createDonationRules,
  createImpactProofRules,
  refreshTokenRules,
};
