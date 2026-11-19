'use strict';
const config = require('../config/env');
const AppError = require('../utils/AppError');

function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl.split('?')[0]}`, 404, 'ROUTE_NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let code = err.code && typeof err.code === 'string' ? err.code : 'INTERNAL_ERROR';
  let message = err.message;
  let details = err.details;

  if (err.name === 'ValidationError' && err.errors) { // Mongoose validation
    status = 400; code = 'VALIDATION_ERROR'; message = 'Validation failed.';
    details = { fields: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])) };
  } else if (err.name === 'CastError') {
    status = 400; code = 'INVALID_ID'; message = 'Invalid identifier supplied.';
  } else if (err.code === 11000) {
    status = 409; code = 'DUPLICATE_KEY'; message = 'A record with the same unique value already exists.';
    details = { fields: Object.keys(err.keyPattern || {}) };
  } else if (err.type === 'entity.parse.failed') {
    status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON request body.';
  } else if (err.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request body is too large.';
  } else if (err.message === 'Not allowed by CORS') {
    status = 403; code = 'CORS_BLOCKED';
  } else if (!err.isOperational) {
    status = 500; code = 'INTERNAL_ERROR';
    // eslint-disable-next-line no-console
    console.error('[error]', req.method, req.originalUrl.split('?')[0], err);
    message = config.isProd ? 'An unexpected error occurred. Please try again later.' : err.message;
    details = config.isProd ? undefined : { stack: String(err.stack || '').split('\n').slice(0, 5) };
  }
  if (status >= 500 && config.isProd) message = 'An unexpected error occurred. Please try again later.';

  res.status(status).json({ success: false, code, message, ...(details ? { details } : {}) });
}

module.exports = { notFound, errorHandler };
