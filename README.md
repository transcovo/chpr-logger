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
    "logger": "git+https://xxx@github.com/transcovo/logger.git#1.0.0"
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
