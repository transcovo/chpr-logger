'use strict';

const bunyan = require('bunyan');
const raven = require('raven');
const sentryStream = require('bunyan-sentry-stream');
const le = require('le_node');

// trace is a useful default for dev
const loggerLevel = process.env.LOGGER_LEVEL || 'info';
const loggerName = process.env.LOGGER_NAME || 'Developpment logger';

// Default logger configuration:
const config = {
  name: loggerName,
  level: loggerLevel,
  streams: [{
    level: loggerLevel,
    stream: process.stdout
  }],
  serializers: {
    err: bunyan.stdSerializers.err   // <--- use this
  }
};

if (process.env.LOGENTRIES_TOKEN) {
  config.streams.push(le.bunyanStream({ token: process.env.LOGENTRIES_TOKEN }));
}

if (process.env.SENTRY_DSN) {
  const client = new raven.Client(process.env.SENTRY_DSN, {/* EXTRAS */});
  config.streams.push(sentryStream(client));
}

// Logger instance:
const logger = bunyan.createLogger(config);

module.exports = logger;
