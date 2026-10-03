const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const storage = process.env.DB_STORAGE || './data/tasks.sqlite';
fs.mkdirSync(path.dirname(storage), { recursive: true });

// To use PostgreSQL/MySQL later, change the dialect and connection options here.
module.exports = new Sequelize({ dialect: 'sqlite', storage, logging: false });
