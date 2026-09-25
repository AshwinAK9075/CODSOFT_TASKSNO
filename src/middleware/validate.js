'use strict';

const { validationResult } = require('express-validator');

/**
 * Runs after a chain of express-validator rules. If anything failed, the
 * request is rejected with 422 and a per-field error list — no database
 * call is ever made with unvalidated input.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(422).json({
    success: false,
    error: {
      status: 422,
      message: 'Validation failed',
      details: result.array().map((e) => ({
        field: e.path,
        value: e.value,
        message: e.msg,
        location: e.location,
      })),
    },
  });
}

module.exports = validate;
