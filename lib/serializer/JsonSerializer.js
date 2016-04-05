'use strict';

const AbstractSerializer = require('./AbstractSerializer');

class JsonSerializer extends AbstractSerializer {
  constructor(options) {
    super(options);
  }

  serialize(message) {
    return JSON.stringify(message);
  }

  deserialize(message) {
    return JSON.parse(message);
  }
}

module.exports = JsonSerializer;
