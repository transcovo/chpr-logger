'use strict';

const raven = require('raven');

const expect = require('chai').expect;
const rewire = require('rewire');

let logger = require('../index');

const PrettyStream = require('bunyan-prettystream');
const SentryStream = require('bunyan-sentry-stream').SentryStream;
const LogstashStream = require('bunyan-logstash-tcp').LogstashStream;

describe('index.js', () => {
  let oldStdoutWrite;

  describe('Exports', () => {
    it('should export a reference to raven', () => {
      expect(logger).to.have.property('raven', raven);
    });

    it('should export the raven client (no sentry DSN set)', () => {
      expect(logger).to.have.property('ravenClient', undefined);
    });

    it('should export the raven client (with sentry DSN set)', () => {
      const oldEnv = process.env;
      process.env = {
        LOGGER_NAME: 'Test logger name',
        LOGGER_LEVEL: 'debug',
        LOGENTRIES_TOKEN: '00000000-0000-0000-0000-000000000000',
        SENTRY_DSN: 'https://a:b@fake.com/12345'
      };
      logger = rewire('../index');
      expect(logger).to.have.property('ravenClient');
      expect(logger.ravenClient).to.be.instanceof(raven.Client);
      process.env = oldEnv;
    });
  });

  describe('Log functions', () => {
    const logs = [];

    before(() => {
      oldStdoutWrite = process.stdout.write;

      process.stdout.write = function stubStdout(string) {
        try {
          string = JSON.parse(string);
          logs.push(string);
        } catch (e) {
          oldStdoutWrite.apply(process.stdout, arguments);
        }
      };

      const oldEnv = process.env;
      process.env = {
        LOGGER_NAME: 'Test logger name',
        LOGGER_LEVEL: 'debug',
        LOGENTRIES_TOKEN: '00000000-0000-0000-0000-000000000000',
        SENTRY_DSN: 'https://a:b@fake.com/12345'
      };
      logger = rewire('../index');
      process.env = oldEnv;
    });

    after(() => {
      process.stdout.write = oldStdoutWrite;
    });

    it('should output the fatal level message', () => {
      logger.fatal('hello');
      let message = logs.shift();
      expect(message.name).to.be.eql('Test logger name');
      expect(message.msg).to.be.eql('hello');
      expect(message.level).to.be.eql(60);

      // Should keep the object safe:
      logger.fatal({
        a: 1
      }, 'hello');
      message = logs.shift();

      expect(message.a).to.be.eql(1);

      // Should use the Error object for the stack:
      logger.fatal(new Error('Fatal error'), 'hello');
      message = logs.shift();

      expect(message.err).to.be.an('object').with.property('stack');
      expect(message.err.stack.substr(0, 18)).to.be.eql('Error: Fatal error');
    });
    it('should output the error level message', () => {
      logger.error('hello');
      let message = logs.shift();
      expect(message.level).to.be.eql(50);

      // Should keep the object safe:
      logger.error({
        a: 1
      }, 'hello');
      message = logs.shift();

      expect(message.a).to.be.eql(1);

      // Should use the Error object for the stack:
      logger.error(new Error('Fatal error'), 'hello');
      message = logs.shift();

      expect(message.err).to.be.an('object');
      expect(message.err.stack.substr(0, 18)).to.be.eql('Error: Fatal error');
    });
    it('should output the warn level message', () => {
      logger.warn('hello');
      const message = logs.shift();
      expect(message).to.have.property('level', 40);
      expect(message).to.not.have.property('stack');
    });
    it('should output the info level message', () => {
      logger.info('hello');
      const message = logs.shift();
      expect(message).to.have.property('level', 30);
    });
    it('should output the debug level message', () => {
      logger.debug('hello');
      const message = logs.shift();
      expect(message).to.have.property('level', 20);
    });
    it('should not output the trace level message (level set to debug)', () => {
      logger.trace('hello');
      expect(logs).to.have.lengthOf(0);
    });

    it('should format message correctly', () => {
      logger.info('hello %s', 20);
      const message = logs.shift();
      expect(message.msg).to.be.eql('hello 20');
    });

    it('should keep objects safe', () => {
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
  });

  describe('Streams configuration', () => {
    let originalEnv;

    /**
     * Reload logger configuration
     * @returns {logger} The reloaded logger
     */
    function reloadConfig() {
      delete require.cache[require.resolve('../index')];
      return rewire('../index').__get__('config');
    }

    beforeEach(() => {
      originalEnv = process.env;
      process.env = {};
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use only the default stdout stream without NODE_ENV', () => {
      const config = reloadConfig();

      expect(config.streams).to.have.lengthOf(1);
      expect(config.streams[0]).to.not.include.keys('type');
    });

    it('should use the pretty stream formatter with USE_BUNYAN_PRETTY_STREAM set to true', () => {
      process.env.USE_BUNYAN_PRETTY_STREAM = 'true';
      const config = reloadConfig();

      expect(config.streams).to.have.lengthOf(1);
      expect(config.streams[0]).to.have.property('type', 'raw');
      expect(config.streams[0]).to.have.property('level', 'info');
      expect(config.streams[0].stream).to.be.instanceOf(PrettyStream);
    });

    it('should have sentry stream with LOGENTRIES_TOKEN set', () => {
      process.env.LOGENTRIES_TOKEN = '00000000-0000-0000-0000-000000000000';
      const config = reloadConfig();

      expect(config.streams).to.have.lengthOf(2);
      expect(config.streams[1].name).to.equal('logentries');
    });

    it('should have sentry stream with SENTRY_DSN set', () => {
      process.env.SENTRY_DSN = 'https://a:b@fake.com/12345';
      const config = reloadConfig();

      expect(config.streams).to.have.lengthOf(2);
      expect(config.streams[1].stream).to.be.instanceOf(SentryStream);
    });

    it('should have logstash stream on the default port', () => {
      process.env.LOGSTASH_HOST = 'samplehost';
      const config = reloadConfig();
      expect(config.streams).to.have.lengthOf(2);
      expect(config.streams[1].stream).to.be.instanceOf(LogstashStream);
      expect(config.streams[1].stream).to.have.property('host', 'samplehost');
      expect(config.streams[1].stream).to.have.property('port', 5000);
    });

    it('should have logstash stream on the specified port', () => {
      process.env.LOGSTASH_HOST = 'samplehost';
      process.env.LOGSTASH_PORT = '5001';
      const config = reloadConfig();
      expect(config.streams).to.have.lengthOf(2);
      expect(config.streams[1].stream).to.be.instanceOf(LogstashStream);
      expect(config.streams[1].stream).to.have.property('host', 'samplehost');
      expect(config.streams[1].stream).to.have.property('port', 5001);
    });
  });
});
