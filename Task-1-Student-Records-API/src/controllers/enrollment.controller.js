'use strict';

const { sequelize, Enrollment, Student, Course } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { buildQueryOptions, paginate } = require('../utils/queryFeatures');

const QUERY_CONFIG = {
  searchable: [],
  filterable: ['studentId', 'courseId', 'status', 'semester', 'grade'],
  sortable: ['id', 'studentId', 'courseId', 'enrolledOn', 'status', 'grade', 'createdAt'],
};

const withRelations = [
  { model: Student, as: 'student', attributes: ['id', 'rollNumber', 'firstName', 'lastName', 'email'] },
  { model: Course, as: 'course', attributes: ['id', 'code', 'title', 'credits'] },
];

async function findEnrollmentOr404(id) {
  const enrollment = await Enrollment.findByPk(id, { include: withRelations });
  if (!enrollment) throw ApiError.notFound(`Enrollment with id ${id} was not found`);
  return enrollment;
}

/**
 * GET /api/v1/enrollments
 * e.g. /api/v1/enrollments?studentId=3&status=enrolled&sort=-enrolledOn
 */
const listEnrollments = asyncHandler(async (req, res) => {
  const { page, limit, offset, where, order } = buildQueryOptions(req.query, QUERY_CONFIG);

  const { rows, count } = await Enrollment.findAndCountAll({
    where,
    order,
    limit,
    offset,
    include: withRelations,
  });

  res.status(200).json({ success: true, ...paginate({ rows, count, page, limit }) });
});

/** GET /api/v1/enrollments/:id */
const getEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await findEnrollmentOr404(req.params.id);
  res.status(200).json({ success: true, data: enrollment });
});

/**
 * POST /api/v1/enrollments
 *
 * Business rules enforced here (beyond schema validation):
 *   1. student and course must exist                        -> 404
 *   2. the course must be open for enrollment               -> 409
 *   3. the course must have a free seat                     -> 409
 *   4. a student cannot enroll twice in the same course+semester -> 409
 *
 * The check-then-insert runs inside a transaction so a concurrent request
 * cannot slip past the capacity check.
 */
const createEnrollment = asyncHandler(async (req, res) => {
  const { studentId, courseId, semester = null, enrolledOn, status, grade } = req.body;

  const enrollment = await sequelize.transaction(async (t) => {
    const [student, course] = await Promise.all([
      Student.findByPk(studentId, { transaction: t }),
      Course.findByPk(courseId, { transaction: t }),
    ]);

    if (!student) throw ApiError.notFound(`Student with id ${studentId} was not found`);
    if (!course) throw ApiError.notFound(`Course with id ${courseId} was not found`);

    if (student.status !== 'active') {
      throw ApiError.conflict(`Student ${student.rollNumber} is not active and cannot be enrolled`);
    }
    if (course.status !== 'open') {
      throw ApiError.conflict(`Course ${course.code} is not open for enrollment`);
    }

    const duplicate = await Enrollment.findOne({
      where: { studentId, courseId, semester },
      transaction: t,
    });
    if (duplicate) {
      throw ApiError.conflict(
        `Student ${student.rollNumber} is already enrolled in ${course.code}${semester ? ` for ${semester}` : ''}`
      );
    }

    const enrolledCount = await Enrollment.count({
      where: { courseId, status: 'enrolled' },
      transaction: t,
    });
    if (enrolledCount >= course.capacity) {
      throw ApiError.conflict(`Course ${course.code} is full (capacity ${course.capacity})`);
    }

    return Enrollment.create(
      { studentId, courseId, semester, enrolledOn, status, grade },
      { transaction: t }
    );
  });

  const created = await Enrollment.findByPk(enrollment.id, { include: withRelations });

  res
    .status(201)
    .location(`/api/v1/enrollments/${created.id}`)
    .json({ success: true, message: 'Enrollment created', data: created });
});

/** PUT /api/v1/enrollments/:id — used to record completion, grades or drops */
const updateEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await findEnrollmentOr404(req.params.id);

  const changes = {};
  for (const field of ['semester', 'status', 'grade']) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) changes[field] = req.body[field];
  }

  // Dropping an enrollment clears any recorded grade.
  if (changes.status === 'dropped') changes.grade = null;

  await enrollment.update(changes);
  await enrollment.reload({ include: withRelations });

  res.status(200).json({ success: true, message: 'Enrollment updated', data: enrollment });
});

/** DELETE /api/v1/enrollments/:id */
const deleteEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await findEnrollmentOr404(req.params.id);
  await enrollment.destroy();
  res.status(204).send();
});

module.exports = {
  listEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
};
