const { ForbiddenError } = require('../utils/errors');

/**
 * Role-based access control middleware.
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Role ${req.user.role} is not authorized. Required: ${roles.join(', ')}`
      );
    }

    next();
  };
};

module.exports = { authorize };
