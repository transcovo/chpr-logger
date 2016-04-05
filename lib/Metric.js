'use strict';

const os = require('os');

const utils = require('./utils');

class Metric {
  constructor(type, value, sampleRate, tags) {
    this.name = logger.getName();
    this.hostname = os.hostname();

    this.pid = process.pid;
    this.date = new Date();
    this.type = type;
    this.value = value;
    this.sampleRate = sampleRate;
    this.tags = tags;
  }

  toJSON() {
    const json = {};
    for (var key in this) {
      json[key] = this[key];
    }
    return json;
  }
}

module.exports = Metric;
