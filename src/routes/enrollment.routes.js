'use strict';

const express = require('express');
const controller = require('../controllers/enrollment.controller');
const rules = require('../validators/enrollment.validator');
const validate = require('../middleware/validate');

const router = express.Router();

router
  .route('/')
  .get(controller.listEnrollments)
  .post(rules.createEnrollment, validate, controller.createEnrollment);

router
  .route('/:id')
  .get(rules.idParam(), validate, controller.getEnrollment)
  .put(rules.updateEnrollment, validate, controller.updateEnrollment)
  .patch(rules.updateEnrollment, validate, controller.updateEnrollment)
  .delete(rules.idParam(), validate, controller.deleteEnrollment);

module.exports = router;
