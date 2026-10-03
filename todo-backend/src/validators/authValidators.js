const { body } = require('express-validator');

exports.register = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8, max: 72 }).withMessage('password must be 8-72 characters'),
];

exports.login = [
  body('email').trim().isEmail().withMessage('valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('password is required'),
];
