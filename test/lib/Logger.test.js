'use strict';

var dgram = require('dgram');
var _ = require('lodash');

// Load the Logger class:
var Logger = require('../../lib/Logger');

var logger = new Logger({
  logger: {
    name: 'app',
    level: 'trace'
  },
  metrics: {}
});

var old_stdout_write, logs = [];

describe('Logger.js', function() {

  before(function() {
    old_stdout_write = process.stdout.write;

    process.stdout.write = (function(write) {
      return function(string) {

        try {

          string = JSON.parse(string);
          logs.push(string);

        } catch (e) {

          var args = _.toArray(arguments);
          write.apply(process.stdout, args);

        }
      };
    }(process.stdout.write));
  });

  after(function() {
    process.stdout.write = old_stdout_write;
  });

  it('patchGlobal extend global.console functions',function(){
    expect(global.console.fatal).to.not.exist;
    expect(global.console.debug).to.not.exist;
    expect(global.console.metric).to.not.exist;
    logger.patchGlobal();
    expect(typeof global.console.fatal).to.be.eql('function');
    expect(typeof global.console.debug).to.be.eql('function');
  });
  it('replaceGlobal replace global.console functions',function(){
    // Don't know how to test it without destroying all following stdout
    var _global = {console:{}};
    logger.replaceGlobal(_global);

    expect(typeof _global.console.fatal).to.be.eql('function');
    expect(typeof _global.console.debug).to.be.eql('function');
    expect(typeof _global.console.metric).to.be.eql('function');
    expect(typeof _global.console.error).to.be.eql('function');
    expect(typeof _global.console.warn).to.be.eql('function');
    expect(typeof _global.console.info).to.be.eql('function');
    expect(typeof _global.console.trace).to.be.eql('function');
    expect(typeof _global.console.log).to.be.eql('function');

    _global.console.metric('increment','test'); logs.shift();
    _global.console.log('test'); logs.shift();
    _global.console.log('ALERT'); logs.shift();
    _global.console.log('Error'); logs.shift();
    _global.console.log('exception'); logs.shift();
    _global.console.log('WARN'); logs.shift();
    _global.console.log({}); logs.shift();
  });
  it('should output the log level message', function() {
    logger.log('info', 'hello');
    var message = logs.shift();
    expect(message.msg).to.be.eql('hello');
  });

  it('should output the fatal level message', function() {
    logger.fatal('hello');
    var message = logs.shift();
    expect(message.name).to.be.eql('app');
    expect(message.msg).to.be.eql('hello');
    expect(message.level).to.be.eql(60);

    expect(message.err).to.exist;

    // Should keep the object safe:
    logger.fatal({
      a: 1
    }, 'hello');
    message = logs.shift();

    expect(message.a).to.be.eql(1);
    expect(message.err).to.exist;

    // Should use the Error object for the stack:
    logger.fatal(new Error('Fatal error'), 'hello');
    message = logs.shift();

    expect(message.err).to.exist;
    expect(message.err.stack.substr(0, 18)).to.be.eql('Error: Fatal error');

  });
  it('should output the error level message', function() {
    logger.error('hello');
    var message = logs.shift();
    expect(message.level).to.be.eql(50);
    expect(message.err).to.exist;

    // Should keep the object safe:
    logger.error({
      a: 1
    }, 'hello');
    message = logs.shift();

    expect(message.a).to.be.eql(1);
    expect(message.err).to.exist;

    // Should use the Error object for the stack:
    logger.error(new Error('Fatal error'), 'hello');
    message = logs.shift();

    expect(message.err).to.exist;
    expect(message.err.stack.substr(0, 18)).to.be.eql('Error: Fatal error');

  });
  it('should output the warn level message', function() {
    logger.warn('hello');
    var message = logs.shift();
    expect(message.level).to.be.eql(40);
    expect(message.stack).to.not.exist;
  });
  it('should output the info level message', function() {
    logger.info('hello');
    var message = logs.shift();
    expect(message.level).to.be.eql(30);
  });
  it('should output the debug level message', function() {
    logger.debug('hello');
    var message = logs.shift();
    expect(message.level).to.be.eql(20);
  });
  it('should output the trace level message', function() {
    logger.trace('hello');
    var message = logs.shift();
    expect(message.level).to.be.eql(10);
    expect(message.trace).to.exist;

    logger.trace({a:1},'hello');
    var message = logs.shift();
    expect(message.a).to.be.eql(1);
    expect(message.trace).to.exist;
  });

  it('should remove not used message levels', function() {
    // Change the logger level
    logger = new Logger({
      logger: {
        name: 'app',
        level: 'info'
      }
    });
    logger.trace('hello');
    var message = logs.shift();
    expect(message).to.be.eql(undefined);

    logger.debug('hello');
    message = logs.shift();
    expect(message).to.be.eql(undefined);

    logger.info('hello');
    message = logs.shift();
    expect(message.level).to.be.eql(30);
  });

  it('should format message correctly', function() {
    logger.info('hello %s', 20);
    var message = logs.shift();
    expect(message.msg).to.be.eql('hello 20');
  });

  it('should build Sentry object correcty', function() {

    logger = new Logger({
      logger: {
        name: 'app',
        level: 'info'
      },
      sentry: {
        dsn: 'https://abcdefghijklmnnopqrstuvwxyz:abcdefghijklmnnopqrstuvwxyz@app.getsentry.com/12345678',
        level: 50,// error - https://github.com/trentm/node-bunyan#levels
      }
    });

    var sentToRaven = null;
    var stub = sinon.stub(logger._raven, 'captureException', (error, kwargs) => {
       sentToRaven = {error, kwargs};
    })

    logger.error('error message'); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    logger.error(new Error('test'), 'error message' ); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.error.message).to.be.eql('test');
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    logger.error({a: 1}, 'error message' ); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.error.message).to.be.eql('');
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    logger.error(new Error('test'), {path: '/path', a: {b: {c:1}}}, 'error message' ); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.error.message).to.be.eql('test');
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    logger.error({err: new Error('test'), path: '/path', a: {b: {c:1}}}, 'error message' ); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.error.message).to.be.eql('');
    expect(sentToRaven.kwargs.message).to.be.eql('error message');


    logger.fatal('error message'); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    logger.fatal(new Error('test'), 'error message' ); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.error.message).to.be.eql('test');
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    logger.fatal({a: 1}, 'error message' ); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.error.message).to.be.eql('');
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    logger.fatal(new Error('test'), {path: '/path', a: {b: {c:1}}}, 'error message' ); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.error.message).to.be.eql('test');
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    logger.fatal({err: new Error('test'), path: '/path', a: {b: {c:1}}}, 'error message' ); logs.shift();
    expect(sentToRaven.error).to.be.instanceof(Error);
    expect(sentToRaven.error.message).to.be.eql('');
    expect(sentToRaven.kwargs.message).to.be.eql('error message');

    stub.restore();
  });

  it('should keep objects safe', function() {
    logger.info({
      a: 1,
      b: {
        c: 1
      }
    }, 'hello');
    var message = logs.shift();
    expect(message.a).to.be.eql(1);
    expect(message.b).to.be.eql({
      c: 1
    });
    expect(message.msg).to.be.eql('hello');
  });

  it('should output log level with no configuration', function() {
    logger = new Logger();
    expect(logger._log).to.be.eql(console, 'Use the default console object');
  });

  it('should not crash if statsd not well initialized', function(done) {
    logger = new Logger();
    logger.metric('increment', 'hello');
    done();
  });

  it('should send metrics on UDP port 8125', function(done) {
    logger = new Logger({
      metrics: {}
    });
    var server = dgram.createSocket('udp4');
    server.on('error', function(msg) {
      msg.toString().should.eql('hello:1|c');
      done();
    });
    server.on('message', function(msg) {
      expect(msg.toString()).to.be.eql('hello:1|c');
      done();
    });
    server.bind(8125);

    logger.metric('increment', 'hello');
  });
});
