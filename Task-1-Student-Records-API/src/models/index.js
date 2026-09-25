'use strict';

const { sequelize } = require('../config/database');

const Student = require('./student.model')(sequelize);
const Course = require('./course.model')(sequelize);
const Enrollment = require('./enrollment.model')(sequelize);

/**
 * Relationships
 * -------------
 * Student 1---N Enrollment N---1 Course
 * (i.e. a many-to-many between Student and Course, with Enrollment as the
 * join table carrying its own attributes: semester, status, grade.)
 */
Student.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Student.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: 'studentId',
  otherKey: 'courseId',
  as: 'courses',
});
Course.belongsToMany(Student, {
  through: Enrollment,
  foreignKey: 'courseId',
  otherKey: 'studentId',
  as: 'students',
});

module.exports = { sequelize, Student, Course, Enrollment };
