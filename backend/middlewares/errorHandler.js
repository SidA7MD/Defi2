const { AppError, ValidationError } = require('../utils/errors');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: 'A record with this value already exists',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Record not found',
    });
  }

  // Validation errors (express-validator)
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      errors: err.errors,
    });
  }

  // Custom operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }

  // Default 500 error
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
};

module.exports = { errorHandler };
