'use strict';

require('dotenv').config();

/**
 * Centralised, validated application configuration.
 * Everything that can differ between environments is read here and nowhere else.
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,

  db: {
    // "sqlite" (default, zero setup) or "postgres"
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './data/app.sqlite',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'student_records',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.DB_LOGGING === 'true',
  },

  pagination: {
    defaultLimit: Number(process.env.DEFAULT_PAGE_SIZE) || 10,
    maxLimit: Number(process.env.MAX_PAGE_SIZE) || 100,
  },
};

module.exports = config;
