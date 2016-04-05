'use strict';

const EventEmitter = require('events').EventEmitter;

const utils = require('./utils');

const Message = require('./Message');
const Metric = require('./Metric');
const Stream = require('./Stream');
const serializerFactory = require('./serializer/factory');

const LEVELS = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
  FATAL: 60
}

class Logger extends EventEmitter {
  constructor(options) {
    super(options);

    // Initialize the logger:
    this.init(options);

    // Bind the process handler to the message
    // event emission:
    this.on('write', this.write);
    this.on('read', this.read);
  }

  init(options) {
    options = options || {};

    // Keep original configuration parameters:
    this._options = options;

    // Streams:
    if (!this.options().streams) {
      this._options.streams = [new Stream({
        name: 'default',
        stream: process.stdout,
        serializer: serializerFactory.create('bunyan')
      })];
    }

    // Streams normalization:
    for (const i in this.options().streams) {
      const stream = this.options().streams[i];
      if (!(stream instanceof Stream)) {
        this._options.streams[i] = new Stream(stream);
      }
    }
  }

  // Create a logger child:
  child(options) {
    return new Logger(utils.extend(options, this._options));
  }

  write(message) {
    if (message instanceof Message) {
      for (var stream of this.streams()) {
        stream.write(message);
      }
    }
  }

  read(message) {
    for (var stream of this.streams()) {
      const entry = stream.read(message);
      if (entry !== false) {
        this.log(entry.level, entry.error, entry.context, entry.message);
      }
    }
  }

  log(level, error, context, message) {
    if (this.withStats()) {
      context.stats = utils.stats();
    }
    const log = new Message(this, level, error,
      utils.extend(this.context(), context), message);
    // this.toStack(log);
    this.emit('write', log);
  }

  // LEVEL METHODS

  fatal(error, context, message) {
    this.log(LEVELS.FATAL, error, context, message);
  }

  error(error, context, message) {
    this.log(LEVELS.ERROR, error, context, message);
  }

  warn(error, context, message) {
    this.log(LEVELS.WARN, error, context, message);
  }

  info(context, message) {
    this.log(LEVELS.INFO, null, context, message);
  }

  debug(context, message) {
    this.log(LEVELS.DEBUG, null, context, message);
  }

  trace(context, message) {
    this.log(LEVELS.TRACE, null, context, message);
  }

  metric(type, value, sampleRate, tags) {
    const metric = new Metric(this, type, value, sampleRate, tags);
    this.emit('metric', metric);
  }

  // GETTERS

  options() {
    return this._options || {};
  }

  streams() {
    return this._options.streams || [];
  }

  context() {
    return this.options().context || {};
  }

  withStats() {
    return this.options().withStats || false;
  }

  getName() {
    return this.options().name || 'logger';
  }
}

Logger.prototype.LEVELS = LEVELS;

module.exports = Logger;
