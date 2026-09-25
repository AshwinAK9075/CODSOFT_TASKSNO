'use strict';

const { body, param, query } = require('express-validator');
const { Student } = require('../models');

const idParam = () => [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

/**
 * Field rules come from a factory rather than a shared array: express-validator
 * chains are stateful objects, so reusing one array across two routes would let
 * `.optional()` from the update route leak into the create route.
 *
 * @param {boolean} optional true for PUT/PATCH, where every field may be absent
 */
function studentFieldRules(optional) {
  const opt = (chain) => (optional ? chain.optional() : chain);

  return [
    opt(
      body('rollNumber')
        .trim()
        .notEmpty()
        .withMessage('rollNumber is required')
        .bail()
        .matches(/^[A-Za-z0-9-]{3,20}$/)
        .withMessage('rollNumber may contain 3-20 letters, digits or hyphens')
    ),
    opt(
      body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('firstName must be 2-50 characters')
    ),
    opt(
      body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('lastName must be 1-50 characters')
    ),
    opt(
      body('email').trim().isEmail().withMessage('email must be a valid address').normalizeEmail()
    ),
    body('phone')
      .optional({ nullable: true })
      .trim()
      .matches(/^[+]?[0-9\s-]{7,20}$/)
      .withMessage('phone must be 7-20 digits, optionally prefixed with +'),
    body('dateOfBirth')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('dateOfBirth must be an ISO date (YYYY-MM-DD)')
      .bail()
      .custom((value) => {
        const dob = new Date(value);
        if (dob >= new Date()) throw new Error('dateOfBirth must be in the past');
        const years = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
        if (years < 10 || years > 100) throw new Error('student age must be between 10 and 100');
        return true;
      }),
    body('department')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 80 })
      .withMessage('department must be at most 80 characters'),
    body('status')
      .optional()
      .isIn(Student.STATUSES)
      .withMessage(`status must be one of: ${Student.STATUSES.join(', ')}`),
  ];
}

const createStudent = studentFieldRules(false);

const updateStudent = [
  ...idParam(),
  ...studentFieldRules(true),
  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('request body must contain at least one field to update');
    }
    return true;
  }),
];

const listStudents = [
  query('status')
    .optional()
    .custom((value) =>
      String(value)
        .split(',')
        .every((v) => Student.STATUSES.includes(v.trim()))
    )
    .withMessage(`status must be one of: ${Student.STATUSES.join(', ')}`),
];

module.exports = { createStudent, updateStudent, listStudents, idParam };
