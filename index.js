'use strict';

const bunyan = require('bunyan');
const raven = require('raven');
const sentryStream = require('bunyan-sentry-stream');
const PrettyStream = require('bunyan-prettystream');

const SensitiveDataStream = require('./streams/sensitive-data');

const loggerLevel = process.env.LOGGER_LEVEL || 'info';
const loggerName = process.env.LOGGER_NAME || 'Development logger';

const config = {
  name: loggerName,
  level: loggerLevel,
  streams: [],
  serializers: {
    err: bunyan.stdSerializers.err
  }
};

if (process.env.USE_BUNYAN_PRETTY_STREAM === 'true') {
  const prettyStdOut = new PrettyStream();
  prettyStdOut.pipe(process.stdout);
  config.streams.push({ type: 'raw', level: loggerLevel, stream: prettyStdOut });
} else if (process.env.LOGGER_USE_SENSITIVE_DATA_STREAM !== 'false') {
  config.streams.push({
    level: loggerLevel,
    stream: new SensitiveDataStream(process.env.LOGGER_SENSITIVE_DATA_PATTERN)
  });
} else {
  config.streams.push({ level: loggerLevel, stream: process.stdout });
}

let client;
if (process.env.SENTRY_DSN) {
  client = new raven.Client(process.env.SENTRY_DSN, { name: loggerName });
  client.install();
  config.streams.push(sentryStream(client));
}

// Logger instance:
const logger = bunyan.createLogger(config);

module.exports = logger;
module.exports.raven = raven;
module.exports.ravenClient = client;
