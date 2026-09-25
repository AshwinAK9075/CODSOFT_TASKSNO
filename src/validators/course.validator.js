'use strict';

const { body, param } = require('express-validator');
const { Course } = require('../models');

const idParam = () => [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

function courseFieldRules(optional) {
  const opt = (chain) => (optional ? chain.optional() : chain);

  return [
    opt(
      body('code')
        .trim()
        .toUpperCase()
        .matches(/^[A-Z]{2,4}[0-9]{3}$/)
        .withMessage('code must look like "CS101" (2-4 letters followed by 3 digits)')
    ),
    opt(
      body('title')
        .trim()
        .isLength({ min: 3, max: 120 })
        .withMessage('title must be 3-120 characters')
    ),
    body('description')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 2000 })
      .withMessage('description must be at most 2000 characters'),
    body('credits')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('credits must be an integer between 1 and 12')
      .toInt(),
    body('capacity')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('capacity must be an integer between 1 and 1000')
      .toInt(),
    body('department')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 80 })
      .withMessage('department must be at most 80 characters'),
    body('instructor')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 80 })
      .withMessage('instructor must be at most 80 characters'),
    body('status')
      .optional()
      .isIn(Course.STATUSES)
      .withMessage(`status must be one of: ${Course.STATUSES.join(', ')}`),
  ];
}

const createCourse = courseFieldRules(false);

const updateCourse = [
  ...idParam(),
  ...courseFieldRules(true),
  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('request body must contain at least one field to update');
    }
    return true;
  }),
];

module.exports = { createCourse, updateCourse, idParam };
