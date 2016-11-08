'use strict';

const bunyan = require('bunyan');
const raven = require('raven');
const sentryStream = require('bunyan-sentry-stream');
const logstashStream = require('bunyan-logstash-tcp');
const le = require('le_node');
const PrettyStream = require('bunyan-prettystream');


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
} else {
  config.streams.push({ level: loggerLevel, stream: process.stdout });
}

if (process.env.LOGENTRIES_TOKEN) {
  config.streams.push(le.bunyanStream({
    token: process.env.LOGENTRIES_TOKEN,
    minLevel: loggerLevel,
    withStack: true
  }));
}

if (process.env.LOGSTASH_HOST) {
  config.streams.push({
    type: 'raw',
    stream: logstashStream.createStream({
      host: process.env.LOGSTASH_HOST,
      port: parseInt(process.env.LOGSTASH_PORT || '5000', 10)
    })
  });
}

let client;
if (process.env.SENTRY_DSN) {
  client = new raven.Client(process.env.SENTRY_DSN, { name: loggerName });
  client.patchGlobal();
  config.streams.push(sentryStream(client));
}

// Logger instance:
const logger = bunyan.createLogger(config);

module.exports = logger;
module.exports.raven = raven;
module.exports.ravenClient = client;
