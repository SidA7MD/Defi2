const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Process validation results and throw if invalid
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    throw new ValidationError('Validation failed', formatted);
  }
  next();
};

// ─────────────────────────────────────────────
//  Auth validators
// ─────────────────────────────────────────────

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  // SECURITY: Only DONOR and RESTAURANT can self-register.
  // VALIDATOR and ADMIN must be created by an admin via /api/v1/admin/users
  body('role')
    .isIn(['DONOR', 'RESTAURANT'])
    .withMessage('Invalid role. Only DONOR and RESTAURANT can self-register.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Admin: create privileged user
const createPrivilegedUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters for privileged accounts'),
  body('role')
    .isIn(['VALIDATOR', 'ADMIN'])
    .withMessage('This endpoint only creates VALIDATOR or ADMIN accounts'),
];

// ─────────────────────────────────────────────
//  Need validators
// ─────────────────────────────────────────────

const createNeedRules = [
  body('type').trim().notEmpty().withMessage('Type is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('neighborhood').trim().notEmpty().withMessage('Neighborhood is required'),
  body('estimatedAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be positive'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('restaurantId').optional().isUUID().withMessage('Valid restaurant ID required'),
  body('beneficiaryId').optional().isUUID().withMessage('Valid beneficiary ID required'),
];

// ─────────────────────────────────────────────
//  Donation validators
// ─────────────────────────────────────────────

const createDonationRules = [
  body('needId').isUUID().withMessage('Valid need ID required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
];

// ─────────────────────────────────────────────
//  Impact proof validators
// ─────────────────────────────────────────────

const createImpactProofRules = [
  body('donationId').isUUID().withMessage('Valid donation ID required'),
  body('confirmationMessage')
    .trim()
    .notEmpty()
    .withMessage('Confirmation message is required'),
];

// ─────────────────────────────────────────────
//  Refresh token validator
// ─────────────────────────────────────────────

const refreshTokenRules = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createPrivilegedUserRules,
  createNeedRules,
  createDonationRules,
  createImpactProofRules,
  refreshTokenRules,
};
