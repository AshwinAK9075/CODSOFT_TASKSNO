'use strict';

const { Course, Student, Enrollment } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { buildQueryOptions, paginate } = require('../utils/queryFeatures');

const QUERY_CONFIG = {
  searchable: ['code', 'title', 'description', 'instructor'],
  filterable: ['department', 'credits', 'status', 'instructor', 'code'],
  sortable: ['id', 'code', 'title', 'credits', 'capacity', 'department', 'status', 'createdAt'],
};

async function findCourseOr404(id, options = {}) {
  const course = await Course.findByPk(id, options);
  if (!course) throw ApiError.notFound(`Course with id ${id} was not found`);
  return course;
}

/**
 * GET /api/v1/courses
 * e.g. /api/v1/courses?search=data&credits[gte]=3&sort=code&page=1&limit=10
 */
const listCourses = asyncHandler(async (req, res) => {
  const { page, limit, offset, where, order } = buildQueryOptions(req.query, QUERY_CONFIG);

  const { rows, count } = await Course.findAndCountAll({ where, order, limit, offset });

  res.status(200).json({ success: true, ...paginate({ rows, count, page, limit }) });
});

/** GET /api/v1/courses/:id */
const getCourse = asyncHandler(async (req, res) => {
  const course = await findCourseOr404(req.params.id);
  const enrolledCount = await Enrollment.count({
    where: { courseId: course.id, status: 'enrolled' },
  });

  res.status(200).json({
    success: true,
    data: { ...course.toJSON(), enrolledCount, seatsAvailable: course.capacity - enrolledCount },
  });
});

/** GET /api/v1/courses/:id/students — roster for a course */
const getCourseStudents = asyncHandler(async (req, res) => {
  await findCourseOr404(req.params.id);

  const { page, limit, offset } = buildQueryOptions(req.query, { sortable: [] });

  const { rows, count } = await Enrollment.findAndCountAll({
    where: { courseId: req.params.id },
    include: [{ model: Student, as: 'student' }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  res.status(200).json({ success: true, ...paginate({ rows, count, page, limit }) });
});

/** POST /api/v1/courses */
const createCourse = asyncHandler(async (req, res) => {
  const { code, title, description, credits, department, instructor, capacity, status } = req.body;

  const course = await Course.create({
    code,
    title,
    description,
    credits,
    department,
    instructor,
    capacity,
    status,
  });

  res
    .status(201)
    .location(`/api/v1/courses/${course.id}`)
    .json({ success: true, message: 'Course created', data: course });
});

/** PUT /api/v1/courses/:id */
const updateCourse = asyncHandler(async (req, res) => {
  const course = await findCourseOr404(req.params.id);

  const updatable = ['code', 'title', 'description', 'credits', 'department', 'instructor', 'capacity', 'status'];
  const changes = {};
  for (const field of updatable) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) changes[field] = req.body[field];
  }

  // Capacity must never drop below the number of students already enrolled.
  if (changes.capacity !== undefined) {
    const enrolled = await Enrollment.count({ where: { courseId: course.id, status: 'enrolled' } });
    if (changes.capacity < enrolled) {
      throw ApiError.badRequest(
        `capacity cannot be set below the ${enrolled} student(s) currently enrolled`
      );
    }
  }

  await course.update(changes);

  res.status(200).json({ success: true, message: 'Course updated', data: course });
});

/** DELETE /api/v1/courses/:id */
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await findCourseOr404(req.params.id);
  await course.destroy();
  res.status(204).send();
});

module.exports = {
  listCourses,
  getCourse,
  getCourseStudents,
  createCourse,
  updateCourse,
  deleteCourse,
};
