'use strict';

const raven = require('raven');
const sentryStream = require('bunyan-sentry-stream');

const le = require('le_node');

const Logger = require('./lib/Logger');

// Default logger configuration:
const config = {
  logger: {
    name: process.env.LOGGER_NAME || 'app',
    level: process.env.LOGGER_LEVEL || 'info',
    streams: [{
      level: process.env.LOGGER_LEVEL || 'info',
      stream: process.stdout
    }]
  }
};

if (process.env.LOGGER_NO_STDOUT) {
  config.logger.streams.shift();
}

if (process.env.LOGGER_METRICS_HOST) {
  config.metrics = {
    host: process.env.LOGGER_METRICS_HOST,
    port: process.env.LOGGER_METRICS_PORT,
    prefix: process.env.LOGGER_METRICS_PREFIX || '',
    suffix: process.env.LOGGER_METRICS_SUFFIX || '',
    cacheDns: process.env.LOGGER_METRICS_CACHE_DNS || false
  };
}

if (process.env.LOGENTRIES_TOKEN) {
  config.logger.streams.push(le.bunyanStream({ token: process.env.LOGENTRIES_TOKEN }));
}

if (process.env.SENTRY_DSN) {
  const client = new raven.Client(process.env.SENTRY_DSN, { /* EXTRAS */ });
  config.logger.streams.push(sentryStream(client));
}

// Logger instance:
const logger = new Logger(config);

module.exports = logger;
