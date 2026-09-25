'use strict';

const { DataTypes } = require('sequelize');

const ENROLLMENT_STATUSES = ['enrolled', 'completed', 'dropped'];
const GRADES = ['A', 'B', 'C', 'D', 'E', 'F'];

module.exports = (sequelize) => {
  const Enrollment = sequelize.define(
    'Enrollment',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onDelete: 'CASCADE',
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'courses', key: 'id' },
        onDelete: 'CASCADE',
      },
      semester: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'e.g. "2025-ODD" or "Fall 2025"',
      },
      enrolledOn: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM(...ENROLLMENT_STATUSES),
        allowNull: false,
        defaultValue: 'enrolled',
      },
      grade: {
        type: DataTypes.ENUM(...GRADES),
        allowNull: true,
      },
    },
    {
      tableName: 'enrollments',
      timestamps: true,
      indexes: [
        {
          name: 'enrollments_student_course_semester_unique',
          unique: true,
          fields: ['studentId', 'courseId', 'semester'],
        },
      ],
      validate: {
        // A grade only makes sense once the course has been completed.
        gradeRequiresCompletion() {
          if (this.grade && this.status !== 'completed') {
            throw new Error('grade can only be set when status is "completed"');
          }
        },
      },
    }
  );

  Enrollment.STATUSES = ENROLLMENT_STATUSES;
  Enrollment.GRADES = GRADES;
  return Enrollment;
};
