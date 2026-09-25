'use strict';

const { body, param } = require('express-validator');
const { Enrollment } = require('../models');

const idParam = () => [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')];

const createEnrollment = [
  body('studentId').isInt({ min: 1 }).withMessage('studentId must be a positive integer').toInt(),
  body('courseId').isInt({ min: 1 }).withMessage('courseId must be a positive integer').toInt(),
  body('semester')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('semester must be 3-20 characters'),
  body('enrolledOn')
    .optional()
    .isISO8601()
    .withMessage('enrolledOn must be an ISO date (YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(Enrollment.STATUSES)
    .withMessage(`status must be one of: ${Enrollment.STATUSES.join(', ')}`),
  body('grade')
    .optional({ nullable: true })
    .toUpperCase()
    .isIn(Enrollment.GRADES)
    .withMessage(`grade must be one of: ${Enrollment.GRADES.join(', ')}`),
];

// Enrollments are updated in place; the student/course pair is immutable so a
// mistaken enrollment is deleted rather than re-pointed at another record.
const updateEnrollment = [
  ...idParam(),
  body(['studentId', 'courseId'])
    .not()
    .exists()
    .withMessage('studentId and courseId cannot be changed; delete and recreate the enrollment'),
  body('semester')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('semester must be 3-20 characters'),
  body('status')
    .optional()
    .isIn(Enrollment.STATUSES)
    .withMessage(`status must be one of: ${Enrollment.STATUSES.join(', ')}`),
  body('grade')
    .optional({ nullable: true })
    .toUpperCase()
    .isIn(Enrollment.GRADES)
    .withMessage(`grade must be one of: ${Enrollment.GRADES.join(', ')}`),
  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('request body must contain at least one field to update');
    }
    return true;
  }),
];

module.exports = { createEnrollment, updateEnrollment, idParam };
