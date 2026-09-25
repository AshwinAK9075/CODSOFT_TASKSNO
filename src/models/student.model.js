'use strict';

const { DataTypes } = require('sequelize');

const STUDENT_STATUSES = ['active', 'inactive', 'graduated'];

module.exports = (sequelize) => {
  const Student = sequelize.define(
    'Student',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      rollNumber: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Institution-wide unique roll/registration number',
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: { notEmpty: true, len: [2, 50] },
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: { notEmpty: true, len: [1, 50] },
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...STUDENT_STATUSES),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      tableName: 'students',
      timestamps: true,
      indexes: [{ fields: ['lastName'] }, { fields: ['department'] }],
    }
  );

  Student.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    values.fullName = `${values.firstName} ${values.lastName}`;
    return values;
  };

  Student.STATUSES = STUDENT_STATUSES;
  return Student;
};
