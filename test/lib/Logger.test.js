'use strict';

var dgram = require('dgram');
var _ = require('lodash');

// Load the Logger class:
var Logger = require('../../core/Logger.class');

var logger = new Logger({
  logger: {
    name: 'app',
    level: 'trace'
  },
  metrics: {}
});

var old_stdout_write, logs = [];

describe('core/Logger.js', function() {

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
    should.not.exist(global.console.fatal);
    should.not.exist(global.console.debug);
    should.not.exist(global.console.metric);
    logger.patchGlobal();
    (typeof global.console.fatal).should.be.eql('function');
    (typeof global.console.debug).should.be.eql('function');
    console.metric().should.eql(0);
  });
  it('replaceGlobal replace global.console functions',function(){
    // Don't know how to test it without destroying all following stdout
    var _global = {console:{}};
    logger.replaceGlobal(_global);

    (typeof _global.console.fatal).should.be.eql('function');
    (typeof _global.console.debug).should.be.eql('function');
    (typeof _global.console.metric).should.be.eql('function');
    (typeof _global.console.error).should.be.eql('function');
    (typeof _global.console.warn).should.be.eql('function');
    (typeof _global.console.info).should.be.eql('function');
    (typeof _global.console.trace).should.be.eql('function');
    (typeof _global.console.log).should.be.eql('function');

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
    message.msg.should.eql('hello');
  });

  it('should output the fatal level message', function() {
    logger.fatal('hello');
    var message = logs.shift();
    message.name.should.eql('app');
    message.msg.should.eql('hello');
    message.level.should.eql(60);

    should.exist(message.err);

    // Should keep the object safe:
    logger.fatal({
      a: 1
    }, 'hello');
    message = logs.shift();

    message.a.should.eql(1);
    should.exist(message.err);

    // Should use the Error object for the stack:
    logger.fatal(new Error('Fatal error'), 'hello');
    message = logs.shift();

    should.exist(message.err);
    message.err.stack.should.startWith('Error: Fatal error');

  });
  it('should output the error level message', function() {
    logger.error('hello');
    var message = logs.shift();
    message.level.should.eql(50);
    should.exist(message.err);

    // Should keep the object safe:
    logger.error({
      a: 1
    }, 'hello');
    message = logs.shift();

    message.a.should.eql(1);
    should.exist(message.err);

    // Should use the Error object for the stack:
    logger.error(new Error('Fatal error'), 'hello');
    message = logs.shift();

    should.exist(message.err);
    message.err.stack.should.startWith('Error: Fatal error');

  });
  it('should output the warn level message', function() {
    logger.warn('hello');
    var message = logs.shift();
    message.level.should.eql(40);
    should.not.exist(message.stack);
  });
  it('should output the info level message', function() {
    logger.info('hello');
    var message = logs.shift();
    message.level.should.eql(30);
  });
  it('should output the debug level message', function() {
    logger.debug('hello');
    var message = logs.shift();
    message.level.should.eql(20);
  });
  it('should output the trace level message', function() {
    logger.trace('hello');
    var message = logs.shift();
    message.level.should.eql(10);
    should.exist(message.trace);

    logger.trace({a:1},'hello');
    var message = logs.shift();
    message.a.should.eql(1);
    should.exist(message.trace);
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
    should(message).eql(undefined);

    logger.debug('hello');
    message = logs.shift();
    should(message).eql(undefined);

    logger.info('hello');
    message = logs.shift();
    should(message.level).eql(30);
  });

  it('should format message correctly', function() {
    logger.info('hello %s', 20);
    var message = logs.shift();
    message.msg.should.eql('hello 20');
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
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.kwargs.message.should.be.eql('error message');

    logger.error(new Error('test'), 'error message' ); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.error.message.should.be.eql('test');
    sentToRaven.kwargs.message.should.be.eql('error message');

    logger.error({a: 1}, 'error message' ); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.error.message.should.be.eql('');
    sentToRaven.kwargs.message.should.be.eql('error message');

    logger.error(new Error('test'), {path: '/path', a: {b: {c:1}}}, 'error message' ); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.error.message.should.be.eql('test');
    sentToRaven.kwargs.message.should.be.eql('error message');

    logger.error({err: new Error('test'), path: '/path', a: {b: {c:1}}}, 'error message' ); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.error.message.should.be.eql('');
    sentToRaven.kwargs.message.should.be.eql('error message');


    logger.fatal('error message'); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.kwargs.message.should.be.eql('error message');

    logger.fatal(new Error('test'), 'error message' ); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.error.message.should.be.eql('test');
    sentToRaven.kwargs.message.should.be.eql('error message');

    logger.fatal({a: 1}, 'error message' ); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.error.message.should.be.eql('');
    sentToRaven.kwargs.message.should.be.eql('error message');

    logger.fatal(new Error('test'), {path: '/path', a: {b: {c:1}}}, 'error message' ); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.error.message.should.be.eql('test');
    sentToRaven.kwargs.message.should.be.eql('error message');

    logger.fatal({err: new Error('test'), path: '/path', a: {b: {c:1}}}, 'error message' ); logs.shift();
    sentToRaven.error.should.be.instanceof(Error);
    sentToRaven.error.message.should.be.eql('');
    sentToRaven.kwargs.message.should.be.eql('error message');

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
    message.a.should.eql(1);
    message.b.should.eql({
      c: 1
    });
    message.msg.should.eql('hello');
  });

  it('should output log level with no configuration', function() {
    logger = new Logger();
    logger._log.should.eql(console, 'Use the default console object');
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
      msg.toString().should.eql('hello:1|c');
      done();
    });
    server.bind(8125);

    logger.metric('increment', 'hello');
  });
});
