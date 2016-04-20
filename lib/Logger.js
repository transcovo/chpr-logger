'use strict';

const _ = require('lodash');
const bunyan = require('bunyan');
const StatsD = require('node-statsd');
const assert = require('assert');

/**
 * Logger class for any message.
 * @param config {object} Bunyan configuration file
 */
const Logger = function (config) {
  // Initialize the logger instance:
  this.setConfig(config);
};

/**
 * Update the logger configuration.
 *
 * @param {Object} config configuration object.
 * @param {Object} config.logger Bunyan logger configuration.
 * @see https://github.com/trentm/node-bunyan
 * @param {Object} config.metrics StatsD
 * @see https://github.com/sivy/node-statsd
 */
Logger.prototype.setConfig = function (config) {
  // Logger default configuration:
  this._config = config = config || {};

  if (config.logger) {
    // REF: https://github.com/trentm/node-bunyan
    this._log = bunyan.createLogger(_.merge(config.logger, {
      serializers: {
        err: bunyan.stdSerializers.err,   // <--- use this
      }
    }));
  } else {
    this._log = console;
  }

  if (config.metrics) {
    // REF: https://github.com/sivy/node-statsd
    this._statsd = new StatsD(config.metrics);
    if (this._log.debug) {
      this.debug('Setting logger statsd');
    }
  } else {
    delete this._statsd;
  }
};

/**
 * Logger centric log method for any message.
 * Note: log level must be defined as standard Bunyan
 * level.
 */
Logger.prototype.log = function () {
  const args = Array.prototype.slice.call(arguments);
  const level = args.shift();

  assert(this._log[level], 'Logger level ' + level + ' is undefined');

  return this._log[level].apply(this._log, args);
};

/**
 * Log a fatal error message.
 *
 * Will add the stack trace of the given Error to the message.
 * If no Error object provided as first agument, stack will be
 * buid in the object.
 *
 * Examples:
 * > logger.fatal('message' );
 * > logger.fatal(new Error('test'), 'message' );
 * > logger.fatal({a: 1}, 'message' );
 * > logger.fatal(new Error('test'), {path: '/path', a: {b: {c:1}}}, 'message' );
 * > logger.fatal({err: new Error('test'), path: '/path', a: {b: {c:1}}}, 'message' );
 *
 * @param  {Error} error    Error object
 * @param  {Object} kwargs  Error addition context object
 * @param  {String} message Error message
 */
Logger.prototype.fatal = function () {
  const args = Array.prototype.slice.call(arguments);

  // Add the stack trace:
  if (!(args[0] instanceof Error)) {
    args.unshift(new Error());
  }

  // Add the error object to the context:
  let error = null;
  if (args[0] instanceof Error) {
    error = args.shift();
    if (typeof(args[0]) === 'object') {
      args[0] = _.merge({}, args[0], { err: error });
    } else {
      args.unshift({ err: error });
    }
  }

  // Add the fatal log level:
  args.unshift('fatal');
  return this.log.apply(this, args);
};

/**
 * Log an error message.
 *
 * Will add the stack trace of the given Error to the message.
 * If no Error object provided as first agument, stack will be
 * buid in the object.
 *
 * Examples:
 * > logger.error('message' );
 * > logger.error(new Error('test'), 'message' );
 * > logger.error({a: 1}, 'message' );
 * > logger.error(new Error('test'), {path: '/path', a: {b: {c:1}}}, 'message' );
 * > logger.error({err: new Error('test'), path: '/path', a: {b: {c:1}}}, 'message' );
 *
 * @param  {Error} error    Error object
 * @param  {Object} kwargs  Error addition context object
 * @param  {String} message Error message
 */
Logger.prototype.error = function () {
  const args = Array.prototype.slice.call(arguments);

  // Add the stack trace:
  if (!(args[0] instanceof Error)) {
    args.unshift(new Error());
  }

  // Add the error object to the context:
  let error = null;
  if (args[0] instanceof Error) {
    error = args.shift();
    if (typeof(args[0]) === 'object') {
      args[0] = _.merge({}, args[0], { err: error });
    } else {
      args.unshift({ err: error });
    }
  }

  args.unshift('error');
  return this.log.apply(this, args);
};

/**
 * Log a warning message
 *
 * @param  {Object} kwargs  Error addition context object
 * @param  {String} message Error message
 */
Logger.prototype.warn = function () {
  const args = Array.prototype.slice.call(arguments);

  args.unshift('warn');
  return this.log.apply(this, args);
};

/**
 * Log an info message
 *
 * @param  {Object} kwargs  Error addition context object
 * @param  {String} message Error message
 */
Logger.prototype.info = function () {
  const args = Array.prototype.slice.call(arguments);
  args.unshift('info');
  return this.log.apply(this, args);
};

/**
 * Log a debug message
 *
 * @param  {Object} kwargs  Error addition context object
 * @param  {String} message Error message
 */
Logger.prototype.debug = function () {
  const args = Array.prototype.slice.call(arguments);
  args.unshift('debug');
  return this.log.apply(this, args);
};

/**
 * Log a trace message
 * > same as error message without the message level.
 *
 * @param  {Object} kwargs  Error addition context object
 * @param  {String} message Error message
 */
Logger.prototype.trace = function () {
  const args = Array.prototype.slice.call(arguments);

  if (typeof(args[0]) === 'string') {
    args.unshift({});
  }

  const trace = (new Error()).stack;

  args[0].trace = trace.split('\n').map(function (value) {
    return value.trim();
  });
  args[0].trace.shift();

  args.unshift('trace');

  return this.log.apply(this, args);
};

/**
 * Patch global.Console object with missing methods.
 * @return {Logger} Logger instance
 */
Logger.prototype.patchGlobal = function (_global) {
  _global = _global || global;
  // Overload global console object:
  _global.console.fatal = _global.console.error;
  _global.console.debug = _global.console.info;
  _global.console.metric = function () {
    return 0;
  };
  return this;
};

/**
 * Replace global console definition with this one.
 * > I do not want to add this by default because we should
 * > not have to use global.console object in any case =) !
 *
 * @return {Logger} Logger instance
 */
Logger.prototype.replaceGlobal = function (_global) {
  const self = this;
  _global = _global || global;

  // Patch global object first:
  this.patchGlobal(_global);

  // Replace methods:
  _global.console.fatal = this.fatal;
  _global.console.error = this.error;
  _global.console.warn = this.warn;
  _global.console.info = this.info;
  _global.console.debug = this.debug;
  _global.console.trace = this.trace;

  _global.console.metric = function () {
    const args = Array.prototype.slice.call(arguments);
    args.unshift('metric');
    return this.log.apply(this, args);
  };

  _global.console.log = function () {
    const args = Array.prototype.slice.call(arguments);

    if (['metric', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'].indexOf(args[0]) === -1) {
      args.unshift('info');
    }

    let level = args.shift();
    if (typeof(args[0]) === 'string') {
      if (args[0].indexOf('ALERT') !== -1) {
        level = 'fatal';
      } else if (args[0].indexOf('ERROR') !== -1) {
        level = 'error';
      } else if (args[0].indexOf('Error') !== -1) {
        level = 'error';
      } else if (args[0].indexOf('exception') !== -1) {
        level = 'error';
      } else if (args[0].toUpperCase().indexOf('WARN') !== -1) {
        level = 'warn';
      }
    }

    if (level === 'metric') {
      return self.metric.apply(self, args);
    }

    return self[level].apply(self, args);
  };

  return this;
};


/**
 * Logger metric method.
 * REF: https://github.com/sivy/node-statsd
 * TODO: Metrics to Lowercase
 */
Logger.prototype.metric = function () {
  if (this._statsd) {
    const args = Array.prototype.slice.call(arguments);
    const metric = args.shift();
    assert(this._statsd[metric], 'Logger metric ' + metric + ' is undefined');
    this._statsd[metric].apply(this._statsd, args);
    if (this._log.debug) {
      this.debug({ metric }, 'Updating metric');
    }
  }
};

module.exports = Logger;
