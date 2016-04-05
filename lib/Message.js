'use strict';

const os = require('os');

const utils = require('./utils');

class Message {
  constructor(logger, level, error, context, message) {
    this.name = logger.getName();
    this.hostname = os.hostname();

    this.pid = process.pid;
    this.date = new Date();
    this.level = level;
    this.error = error;
    this.context = utils.copy(context);
    this.message = message;
  }

  toJSON() {
    const json = {};
    for (var key in this) {
      json[key] = this[key];
    }
    return json;
  }

  getDate() {
    return this.date;
  }

  getLevel() {
    return this.level;
  }

  getError() {
    return this.error;
  }

  getContext() {
    return this.context;
  }

  getMessage() {
    return this.message;
  }
}

module.exports = Message;
