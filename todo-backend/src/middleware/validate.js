const { validationResult } = require('express-validator');

module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  res.status(422).json({
    error: 'Validation failed',
    details: result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};
