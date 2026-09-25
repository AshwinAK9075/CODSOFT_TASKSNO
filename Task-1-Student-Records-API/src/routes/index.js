'use strict';

const express = require('express');
const { sequelize } = require('../models');

const router = express.Router();

/** GET /api/v1 — endpoint discovery */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Student Record Management API',
      version: 'v1',
      endpoints: {
        students: '/api/v1/students',
        studentCourses: '/api/v1/students/:id/courses',
        courses: '/api/v1/courses',
        courseStudents: '/api/v1/courses/:id/students',
        enrollments: '/api/v1/enrollments',
        health: '/api/v1/health',
      },
    },
  });
});

/** GET /api/v1/health — liveness plus database reachability */
router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ success: true, data: { status: 'ok', database: 'connected' } });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: { status: 503, message: 'Database unreachable' },
    });
  }
});

router.use('/students', require('./student.routes'));
router.use('/courses', require('./course.routes'));
router.use('/enrollments', require('./enrollment.routes'));

module.exports = router;
