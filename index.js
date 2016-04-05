'use strict';

const Logger = require('./lib/Logger');

const logger = new Logger({
  name: process.env.LOGGER_NAME || 'bunyan'
});

module.exports = logger;
