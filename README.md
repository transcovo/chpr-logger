# Logger for NodeJS

## Getting started

### Installation

```bash
# Install the current node versio:
nvm install

# Install node dependencies
npm install

# Perform the tests
npm test
```

### Require the module

```json
{
  "dependencies": {
    "logger": "git+https://04f5b04a0a707afbdcb70cf1c093471dfabc34c4:x-oauth-basic@github.com/transcovo/logger.git#1.0.0"
  }
}
```

TODO: create the npm repository

## Logging

```javascript
'use strict';

const logger = require('logger');

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

## Configuration

The logger is accepting configuration for streams definition, stats addition, etc.

Here is a full example of logger configuration:

```javascript
'use strict';

const logger = require('logger');

logger.init({
  name: 'my-logger',
  withStats: true,
  streams: [{
    name: 'bunyan',
    stream: process.stdout,
    serializer: 'bunyan'
  }]
})

```
