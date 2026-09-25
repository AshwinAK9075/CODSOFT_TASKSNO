'use strict';

const { Student, Course, Enrollment } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { buildQueryOptions, paginate } = require('../utils/queryFeatures');

const QUERY_CONFIG = {
  searchable: ['firstName', 'lastName', 'email', 'rollNumber'],
  filterable: ['status', 'department', 'rollNumber', 'email'],
  sortable: ['id', 'firstName', 'lastName', 'rollNumber', 'department', 'status', 'createdAt', 'updatedAt'],
};

/** Loads a student or throws a 404. */
async function findStudentOr404(id, options = {}) {
  const student = await Student.findByPk(id, options);
  if (!student) throw ApiError.notFound(`Student with id ${id} was not found`);
  return student;
}

/**
 * GET /api/v1/students
 * Supports ?search= &status= &department= &sort= &page= &limit=
 */
const listStudents = asyncHandler(async (req, res) => {
  const { page, limit, offset, where, order } = buildQueryOptions(req.query, QUERY_CONFIG);

  const { rows, count } = await Student.findAndCountAll({ where, order, limit, offset });

  res.status(200).json({ success: true, ...paginate({ rows, count, page, limit }) });
});

/** GET /api/v1/students/:id */
const getStudent = asyncHandler(async (req, res) => {
  const student = await findStudentOr404(req.params.id, {
    include: [
      {
        model: Enrollment,
        as: 'enrollments',
        include: [{ model: Course, as: 'course', attributes: ['id', 'code', 'title', 'credits'] }],
      },
    ],
  });

  res.status(200).json({ success: true, data: student });
});

/** GET /api/v1/students/:id/courses — courses this student is enrolled in */
const getStudentCourses = asyncHandler(async (req, res) => {
  await findStudentOr404(req.params.id);

  const { page, limit, offset } = buildQueryOptions(req.query, { sortable: [] });

  const { rows, count } = await Enrollment.findAndCountAll({
    where: { studentId: req.params.id },
    include: [{ model: Course, as: 'course' }],
    order: [['enrolledOn', 'DESC']],
    limit,
    offset,
  });

  res.status(200).json({ success: true, ...paginate({ rows, count, page, limit }) });
});

/** POST /api/v1/students */
const createStudent = asyncHandler(async (req, res) => {
  const { rollNumber, firstName, lastName, email, phone, dateOfBirth, department, status } = req.body;

  const student = await Student.create({
    rollNumber,
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    department,
    status,
  });

  res
    .status(201)
    .location(`/api/v1/students/${student.id}`)
    .json({ success: true, message: 'Student created', data: student });
});

/** PUT /api/v1/students/:id — partial updates are accepted */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await findStudentOr404(req.params.id);

  const updatable = ['rollNumber', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'department', 'status'];
  const changes = {};
  for (const field of updatable) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) changes[field] = req.body[field];
  }

  await student.update(changes);

  res.status(200).json({ success: true, message: 'Student updated', data: student });
});

/** DELETE /api/v1/students/:id — enrollments cascade */
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await findStudentOr404(req.params.id);
  await student.destroy();
  res.status(204).send();
});

module.exports = {
  listStudents,
  getStudent,
  getStudentCourses,
  createStudent,
  updateStudent,
  deleteStudent,
};
