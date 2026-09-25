'use strict';

const config = require('../config/env');
const ApiError = require('../utils/ApiError');

/** Reached when no route matched the request. */
function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} does not exist`));
}

/**
 * Single place where every error becomes an HTTP response.
 * Sequelize errors are mapped onto the right status codes so clients
 * never see raw driver messages.
 */
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  switch (err.name) {
    case 'SequelizeValidationError':
      statusCode = 422;
      message = 'Validation failed';
      details = err.errors.map((e) => ({ field: e.path, message: e.message }));
      break;
    case 'SequelizeUniqueConstraintError':
      statusCode = 409;
      message = 'A record with these details already exists';
      details = err.errors.map((e) => ({ field: e.path, message: `${e.path} must be unique` }));
      break;
    case 'SequelizeForeignKeyConstraintError':
      statusCode = 400;
      message = 'Referenced record does not exist';
      break;
    case 'SequelizeDatabaseError':
      statusCode = 400;
      message = 'Malformed request could not be processed';
      break;
    default:
      break;
  }

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}]`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      status: statusCode,
      message,
      ...(details ? { details } : {}),
      ...(config.env === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
