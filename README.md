# Logger for NodeJS

This utility library implements our standard Bunyan + Logentries + Sentry configuration

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
| LOGENTRIES_TOKEN         | no       | Sets the Logentries stream. ([le_node](https://www.npmjs.com/package/le_node))                                                                                                    |
| SENTRY_DSN               | no       | Sets the Sentry stream. ([bunyan-sentry-stream](https://www.npmjs.com/package/bunyan-sentry-stream))                                                                              |
| USE_BUNYAN_PRETTY_STREAM | no       | Outputs the logs on stdout with the pretty formatting from Bunyan. Must be set to `true` to be active. ([bunyan-prettystream](https://www.npmjs.com/package/bunyan-prettystream)) |
| LOGSTASH_HOST            | no       | Logstash host, if you want to configure a logstash stream                                                                                                                         |
| LOGSTASH_PORT            | no       | Logstash port                                                                                                                         |

## Use

```javascript
'use strict';

const logger = require('chpr-logger');

// Log a fatal error message:
logger.fatal(new Error('Fatal'), { field: 1 }, 'fatal message');

// Log an error message:
logger.error(new Error('Error'), { field: 1 }, 'error message');

// Log a warning message:
logger.warn(new Error('Warn'), { field: 1 }, 'warn message');

// Log an informational message:
logger.info({ field: 1 }, 'info message');

// Log a debug message:
logger.debug({ field: 1 }, 'debug message');

// Log a trace message:
logger.trace({ field: 1 }, 'trace message');

```
