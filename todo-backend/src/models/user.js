const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false }, // bcrypt hash only
});

User.prototype.toJSON = function () {
  const { password, ...safe } = this.get();
  return safe;
};

module.exports = User;
