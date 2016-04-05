'use strict';

class AbstractSerializer {
  constructor(options) {
    this.options = options;
  }

  serialize(message) {
    throw new Error('Must implement the serialize method');
  }
}

module.exports = AbstractSerializer;
