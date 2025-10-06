const { API_RESPONSE_CODES } = require('../utils/constants');

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
const { sanitizeRequest } = require('../utils/sanitizer');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    request: sanitizeRequest(req),
    user: req.user ? req.user.id : 'anonymous'
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    statusCode: API_RESPONSE_CODES.INTERNAL_ERROR
  };

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    error.message = 'Validation error';
    error.statusCode = API_RESPONSE_CODES.BAD_REQUEST;
    error.details = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Sequelize unique constraint errors
  else if (err.name === 'SequelizeUniqueConstraintError') {
    error.message = 'Resource already exists';
    error.statusCode = API_RESPONSE_CODES.BAD_REQUEST;
    error.details = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} must be unique`
    }));
  }

  // Sequelize foreign key constraint errors
  else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.message = 'Invalid reference';
    error.statusCode = API_RESPONSE_CODES.BAD_REQUEST;
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = API_RESPONSE_CODES.UNAUTHORIZED;
  }

  else if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = API_RESPONSE_CODES.UNAUTHORIZED;
  }

  // Joi validation errors
  else if (err.isJoi) {
    error.message = 'Validation error';
    error.statusCode = API_RESPONSE_CODES.BAD_REQUEST;
    error.details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  }

  // Custom application errors
  else if (err.statusCode) {
    error.message = err.message;
    error.statusCode = err.statusCode;
    if (err.details) error.details = err.details;
  }

  // Syntax errors
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.message = 'Invalid JSON';
    error.statusCode = API_RESPONSE_CODES.BAD_REQUEST;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.statusCode === API_RESPONSE_CODES.INTERNAL_ERROR) {
    error.message = 'Something went wrong';
    delete error.details;
  }

  res.status(error.statusCode).json(error);
};

/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res) => {
  res.status(API_RESPONSE_CODES.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = API_RESPONSE_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
};