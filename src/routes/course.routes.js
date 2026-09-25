'use strict';

const express = require('express');
const controller = require('../controllers/course.controller');
const rules = require('../validators/course.validator');
const validate = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(controller.listCourses)
  .post(rules.createCourse, validate, controller.createCourse);

router
  .route('/:id')
  .get(rules.idParam(), validate, controller.getCourse)
  .put(rules.updateCourse, validate, controller.updateCourse)
  .patch(rules.updateCourse, validate, controller.updateCourse)
  .delete(rules.idParam(), validate, controller.deleteCourse);

router.get('/:id/students', rules.idParam(), validate, controller.getCourseStudents);

module.exports = router;
