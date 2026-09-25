'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./env');

const logging = config.db.logging ? console.log : false;

let sequelize;

if (config.db.dialect === 'sqlite') {
  // Make sure the directory holding the sqlite file exists before connecting.
  const dir = path.dirname(path.resolve(config.db.storage));
  fs.mkdirSync(dir, { recursive: true });

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.db.storage,
    logging,
  });
} else {
  sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging,
    pool: { max: 10, min: 0, idle: 10000 },
  });
}

/** Verify the connection and (in dev) sync the schema. */
async function connectDatabase({ sync = true, alter = false } = {}) {
  await sequelize.authenticate();
  if (config.db.dialect === 'sqlite') {
    await sequelize.query('PRAGMA foreign_keys = ON');
  }
  if (sync) {
    await sequelize.sync({ alter });
  }
  return sequelize;
}

module.exports = { sequelize, connectDatabase };
