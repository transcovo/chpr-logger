# Logger for NodeJS

This utility library implements our standard Bunyan + Logentries + Sentry configuration

## Requirements

Minimum Node.js version: 4

## Installation

```bash
npm install --save cp-logger
```

## Configuration

* LOGGER_NAME (required)
* LOGGER_LEVEL (required)
* LOGENTRIES_TOKEN (optional)
* SENTRY_DSN (optional)

## Use

```javascript
'use strict';

const logger = require('cp-logger');

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
