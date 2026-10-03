const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'completed'), allowNull: false, defaultValue: 'pending' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
  category: { type: DataTypes.STRING(50), allowNull: true },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
});

module.exports = Task;
