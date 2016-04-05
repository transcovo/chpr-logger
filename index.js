'use strict';

const Logger = require('./lib/Logger');
const serializerFactory = require('./lib/serializer/factory');

const logger = new Logger({
  name: process.env.LOGGER_NAME || 'bunyan',
  streams: [{
    name: 'bunyan',
    stream: process.stdout,
    serializer: serializerFactory.create('bunyan')
  }]
});

module.exports = logger;
