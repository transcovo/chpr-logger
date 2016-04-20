'use strict';

const dgram = require('dgram');
const _ = require('lodash');
const expect = require('chai').expect;

// Load the Logger class:
const Logger = require('../../lib/Logger');

let logger = new Logger({
  logger: {
    name: 'app',
    level: 'trace'
  },
  metrics: {}
});

const logs = [];

describe('Logger.js', function () {
  let oldStdoutWrite;

  before(function () {
    oldStdoutWrite = process.stdout.write;

    process.stdout.write = (function (write) {
      return function (string) {
        try {
          string = JSON.parse(string);
          logs.push(string);
        } catch (e) {
          const args = _.toArray(arguments);
          write.apply(process.stdout, args);
        }
      };
    }(process.stdout.write));
  });

  after(function () {
    process.stdout.write = oldStdoutWrite;
  });

  it('should be able to use metrics without having to path global first', function () {
    expect(global.console).to.not.have.property('fatal'); // make sure this tests stays before global patch

    const metricsLogger = new Logger({
      metrics: {
        host: 'host.example.com',
        port: '1234',
        prefix: 'whatever.',
        cacheDns: false
      }
    });
    metricsLogger.metric('increment', 'who.cares');
  });

  it('patchGlobal extend global.console functions', function () {
    expect(global.console).to.not.have.property('fatal');
    expect(global.console).to.not.have.property('debug');
    expect(global.console).to.not.have.property('metric');
    logger.patchGlobal();
    expect(typeof global.console.fatal).to.be.eql('function');
    expect(typeof global.console.debug).to.be.eql('function');
  });
  it('replaceGlobal replace global.console functions', function () {
    // Don't know how to test it without destroying all following stdout
    const _global = { console: {} };
    logger.replaceGlobal(_global);

    expect(typeof _global.console.fatal).to.be.eql('function');
    expect(typeof _global.console.debug).to.be.eql('function');
    expect(typeof _global.console.metric).to.be.eql('function');
    expect(typeof _global.console.error).to.be.eql('function');
    expect(typeof _global.console.warn).to.be.eql('function');
    expect(typeof _global.console.info).to.be.eql('function');
    expect(typeof _global.console.trace).to.be.eql('function');
    expect(typeof _global.console.log).to.be.eql('function');

    _global.console.metric('increment', 'test');
    logs.shift();
    _global.console.log('test');
    logs.shift();
    _global.console.log('ALERT');
    logs.shift();
    _global.console.log('Error');
    logs.shift();
    _global.console.log('exception');
    logs.shift();
    _global.console.log('WARN');
    logs.shift();
    _global.console.log({});
    logs.shift();
  });
  it('should output the log level message', function () {
    logger.log('info', 'hello');
    const message = logs.shift();
    expect(message.msg).to.be.eql('hello');
  });

  it('should output the fatal level message', function () {
    logger.fatal('hello');
    let message = logs.shift();
    expect(message.name).to.be.eql('app');
    expect(message.msg).to.be.eql('hello');
    expect(message.level).to.be.eql(60);

    expect(message.err).to.be.an('object');

    // Should keep the object safe:
    logger.fatal({
      a: 1
    }, 'hello');
    message = logs.shift();

    expect(message.a).to.be.eql(1);
    expect(message.err).to.be.an('object');

    // Should use the Error object for the stack:
    logger.fatal(new Error('Fatal error'), 'hello');
    message = logs.shift();

    expect(message.err).to.be.an('object').with.property('stack');
    expect(message.err.stack.substr(0, 18)).to.be.eql('Error: Fatal error');
  });
  it('should output the error level message', function () {
    logger.error('hello');
    let message = logs.shift();
    expect(message.level).to.be.eql(50);
    expect(message.err).to.be.an('object');

    // Should keep the object safe:
    logger.error({
      a: 1
    }, 'hello');
    message = logs.shift();

    expect(message.a).to.be.eql(1);
    expect(message.err).to.be.an('object');

    // Should use the Error object for the stack:
    logger.error(new Error('Fatal error'), 'hello');
    message = logs.shift();

    expect(message.err).to.be.an('object');
    expect(message.err.stack.substr(0, 18)).to.be.eql('Error: Fatal error');
  });
  it('should output the warn level message', function () {
    logger.warn('hello');
    const message = logs.shift();
    expect(message).to.have.property('level', 40);
    expect(message).to.not.have.property('stack');
  });
  it('should output the info level message', function () {
    logger.info('hello');
    const message = logs.shift();
    expect(message).to.have.property('level', 30);
  });
  it('should output the debug level message', function () {
    logger.debug('hello');
    const message = logs.shift();
    expect(message).to.have.property('level', 20);
  });
  it('should output the trace level message', function () {
    logger.trace('hello');
    let message = logs.shift();
    expect(message).to.have.property('level', 10);
    expect(message).to.have.property('trace');

    logger.trace({ a: 1 }, 'hello');
    message = logs.shift();
    expect(message.a).to.be.eql(1);
    expect(message).to.have.property('trace');
  });

  it('should remove not used message levels', function () {
    // Change the logger level
    logger = new Logger({
      logger: {
        name: 'app',
        level: 'info'
      }
    });
    logger.trace('hello');
    let message = logs.shift();
    expect(message).to.be.eql(undefined);

    logger.debug('hello');
    message = logs.shift();
    expect(message).to.be.eql(undefined);

    logger.info('hello');
    message = logs.shift();
    expect(message.level).to.be.eql(30);
  });

  it('should format message correctly', function () {
    logger.info('hello %s', 20);
    const message = logs.shift();
    expect(message.msg).to.be.eql('hello 20');
  });

  it('should keep objects safe', function () {
    logger.info({
      a: 1,
      b: {
        c: 1
      }
    }, 'hello');
    const message = logs.shift();
    expect(message.a).to.be.eql(1);
    expect(message.b).to.be.eql({
      c: 1
    });
    expect(message.msg).to.be.eql('hello');
  });

  it('should output log level with no configuration', function () {
    logger = new Logger();
    expect(logger._log).to.be.eql(console, 'Use the default console object');
  });

  it('should not crash if statsd not well initialized', function (done) {
    logger = new Logger();
    logger.metric('increment', 'hello');
    done();
  });

  it('should send metrics on UDP port 8125', function (done) {
    logger = new Logger({
      metrics: {}
    });
    const server = dgram.createSocket('udp4');
    server.on('error', function (msg) {
      msg.toString().should.eql('hello:1|c');
      done();
    });
    server.on('message', function (msg) {
      expect(msg.toString()).to.be.eql('hello:1|c');
      done();
    });
    server.bind(8125);

    logger.metric('increment', 'hello');
  });
});
