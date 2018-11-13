// Type definitions for chpr-logger 2.7.0
// Project: chpr-logger
// Definitions by: Chauffeur Privé
// TypeScript Version: 3.0.1

/// <reference types="node" />

import BaseLogger = require('bunyan');

declare const logger: BaseLogger;
declare namespace logger {
    type Logger = typeof logger;
}

export = logger;
