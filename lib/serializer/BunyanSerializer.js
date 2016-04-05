'use strict';

const utils = require('../utils');

const AbstractSerializer = require('./AbstractSerializer');

class BunyanSerializer extends AbstractSerializer {
  constructor(options) {
    super(options);
  }

  serialize(message) {
    const bunyanLog = message.toJSON();

    // Mapping from Message to the bunyan format:
    bunyanLog.time = bunyanLog.date; delete bunyanLog.date;
    bunyanLog.msg = bunyanLog.message; delete bunyanLog.message;
    bunyanLog.v = 0;

    // Serialize the error object:
    const error = message.error; delete bunyanLog.error;
    if (error instanceof Error) {
      bunyanLog.err = {
        name: error.name,
        message: error.message,
        stack: error.stack || error.toString()
      }
    }

    return JSON.stringify(bunyanLog);
  }

  deserialize(message) {
    const bunyanLog = JSON.parse(message);

    // Mapping from Message to the bunyan format:
    bunyanLog.date = bunyanLog.time; delete bunyanLog.time;
    bunyanLog.message = bunyanLog.msg; delete bunyanLog.msg;
    delete bunyanLog.v;

    if (bunyanLog.err) {
      const error = new Error(bunyanLog.err.name);
      error.message = bunyanLog.err.message;
      error.stack = bunyanLog.err.stack;
      bunyanLog.error = error;
    }

    return bunyanLog;
  }
}

module.exports = BunyanSerializer;
