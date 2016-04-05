'use strict';

const SERIALIZERS = {
  json: require('./JsonSerializer'),
  bunyan: require('./BunyanSerializer')
}

class SerializerFactory {
  constructor() {}

  create(serializer, options) {
    const Serializer = SERIALIZERS[serializer];
    return new Serializer(options);
  }
}

module.exports = SerializerFactory;
