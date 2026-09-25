'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const apiRouter = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- global middleware ----------------------------------------------------
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

// ---- routes ---------------------------------------------------------------
app.get('/', (req, res) => res.redirect(302, '/api/v1'));
app.use('/api/v1', apiRouter);

// ---- error handling (must be last) ---------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
