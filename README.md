# Logger for NodeJS

This utility library implements our standard Bunyan + Sentry configuration

## Requirements

Minimum Node.js version: 4

## Installation

```bash
npm install --save chpr-logger
```

## Configuration

| Key                      | Required | Description                                                                                                                                                                       |
|--------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| LOGGER_NAME              | yes      | Sets the name of the logger.                                                                                                                                                      |
| LOGGER_LEVEL             | yes      | Set the minimum level of logs.                                                                                                                                                    |
| SENTRY_DSN               | no       | Sets the Sentry stream. ([bunyan-sentry-stream](https://www.npmjs.com/package/bunyan-sentry-stream))                                                                              |
| USE_BUNYAN_PRETTY_STREAM | no       | Outputs the logs on stdout with the pretty formatting from Bunyan. Must be set to `true` to be active. ([bunyan-prettystream](https://www.npmjs.com/package/bunyan-prettystream)) |
| LOGSTASH_HOST            | no       | Logstash host, if you want to configure a logstash stream                                                                                                                         |
| LOGSTASH_PORT            | no       | Logstash port                                                                                                                         |

## Use

```javascript
'use strict';

const logger = require('chpr-logger');

/* The signature is logger[level](context, message) where:
- context is an object containing all info to be logged
- context may be passed an `err` property that is an error and will be used by
  sentry to regroup errors and capture proper stacktraces
- message is just a string explaining what the log is

As in bunyan, context is optional and logger[level](message) can also work.
*/

// Log a fatal error message:
logger.fatal({ err: new Error('Fatal'), field: 'additional info' }, 'fatal message');

// Log an error message:
logger.error({ err: new Error('Error'), anotherField: 'extra context' }, 'error message');

// Log a warning message:
logger.warn({ err: new Error('Warn'), userId:'1e7b8d', age: 17 }, 'User is under 18');

// Log an informational message:
logger.info({ field: 1 }, 'info message');

// Log a debug message:
logger.debug({ user }, 'debug message');

// Log a trace message:
logger.trace({ fields: [1, 2, 66]] }, 'trace message');

```
