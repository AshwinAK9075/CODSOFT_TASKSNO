'use strict';

const express = require('express');
const controller = require('../controllers/student.controller');
const rules = require('../validators/student.validator');
const validate = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(rules.listStudents, validate, controller.listStudents)
  .post(rules.createStudent, validate, controller.createStudent);

router
  .route('/:id')
  .get(rules.idParam(), validate, controller.getStudent)
  .put(rules.updateStudent, validate, controller.updateStudent)
  .patch(rules.updateStudent, validate, controller.updateStudent)
  .delete(rules.idParam(), validate, controller.deleteStudent);

router.get('/:id/courses', rules.idParam(), validate, controller.getStudentCourses);

module.exports = router;
