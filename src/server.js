'use strict';

const app = require('./app');
const config = require('./config/env');
const { connectDatabase, sequelize } = require('./config/database');

let server;

async function start() {
  try {
    await connectDatabase({ sync: true, alter: config.env === 'development' });
    console.log(`Database connected (${config.db.dialect})`);

    server = app.listen(config.port, () => {
      console.log(`API listening on http://localhost:${config.port}/api/v1 [${config.env}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

start();
