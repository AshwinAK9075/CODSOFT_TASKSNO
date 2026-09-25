'use strict';

const { DataTypes } = require('sequelize');

const COURSE_STATUSES = ['open', 'closed', 'archived'];

module.exports = (sequelize) => {
  const Course = sequelize.define(
    'Course',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
        comment: 'Course code, e.g. CS101',
      },
      title: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { notEmpty: true, len: [3, 120] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      credits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        validate: { min: 1, max: 12 },
      },
      department: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      instructor: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
        validate: { min: 1, max: 1000 },
      },
      status: {
        type: DataTypes.ENUM(...COURSE_STATUSES),
        allowNull: false,
        defaultValue: 'open',
      },
    },
    {
      tableName: 'courses',
      timestamps: true,
      indexes: [{ fields: ['department'] }, { fields: ['credits'] }],
    }
  );

  Course.STATUSES = COURSE_STATUSES;
  return Course;
};
