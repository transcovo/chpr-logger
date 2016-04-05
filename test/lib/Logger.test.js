'use strict';

const Logger = require(`${path.root}/lib/Logger`);
const Message = require(`${path.root}/lib/Message`);

const serializerFactory = require(`${path.root}/lib/serializer/factory`);

describe('Logger.class.js', () => {
  it('instanciates the class with no configuration', () => {
    const logger = new Logger();
    expect(logger).to.be.instanceof(Logger);
  });

  it('emits a fatal log message', (done) => {
    const logger = new Logger();

    logger.on('write', (message) => {
      expect(message).to.be.instanceof(Message);
      expect(message.getMessage()).to.be.eql('Hello');
      expect(message.getContext()).to.be.eql({a: 1});
      expect(message.getLevel()).to.be.eql(logger.LEVELS.FATAL);
      expect(message.getDate()).to.be.an.instanceof(Date);
      expect(message.getError()).to.be.an.instanceof(Error);
      expect(message.getError().message).to.be.eql('Custom error');
      done();
    });

    logger.fatal(new Error('Custom error'), {a:1}, 'Hello');
  });

  it('emits a error log message', (done) => {
    const logger = new Logger();

    logger.on('write', (message) => {
      expect(message).to.be.instanceof(Message);
      expect(message.getMessage()).to.be.eql('Hello');
      expect(message.getContext()).to.be.eql({a: 1});
      expect(message.getLevel()).to.be.eql(logger.LEVELS.ERROR);
      expect(message.getDate()).to.be.an.instanceof(Date);
      expect(message.getError()).to.be.an.instanceof(Error);
      expect(message.getError().message).to.be.eql('Custom error');
      done();
    });

    logger.error(new Error('Custom error'), {a:1}, 'Hello');
  });

  it('emits a warn log message', (done) => {
    const logger = new Logger();

    logger.on('write', (message) => {
      expect(message).to.be.instanceof(Message);
      expect(message.getMessage()).to.be.eql('Hello');
      expect(message.getContext()).to.be.eql({a: 1});
      expect(message.getLevel()).to.be.eql(logger.LEVELS.WARN);
      expect(message.getDate()).to.be.an.instanceof(Date);
      expect(message.getError()).to.be.an.instanceof(Error);
      expect(message.getError().message).to.be.eql('Custom error');
      done();
    });

    logger.warn(new Error('Custom error'), {a:1}, 'Hello');
  });

  it('emits an info log message', (done) => {
    const logger = new Logger();

    logger.on('write', (message) => {
      expect(message).to.be.instanceof(Message);
      expect(message.getMessage()).to.be.eql('Hello');
      expect(message.getContext()).to.be.eql({a: 1});
      expect(message.getLevel()).to.be.eql(30);
      expect(message.getDate()).to.be.an.instanceof(Date);
      expect(message.getError()).to.be.null;
      done();
    });

    logger.info({a:1}, 'Hello');
  });

  it('emits a debug log message', (done) => {
    const logger = new Logger();

    logger.on('write', (message) => {
      expect(message).to.be.instanceof(Message);
      expect(message.getMessage()).to.be.eql('Hello');
      expect(message.getContext()).to.be.eql({a: 1});
      expect(message.getLevel()).to.be.eql(logger.LEVELS.DEBUG);
      expect(message.getDate()).to.be.an.instanceof(Date);
      expect(message.getError()).to.be.null;
      done();
    });

    logger.debug({a:1}, 'Hello');
  });

  it('emits a trace log message', (done) => {
    const logger = new Logger();

    logger.on('write', (message) => {
      expect(message).to.be.instanceof(Message);
      expect(message.getMessage()).to.be.eql('Hello');
      expect(message.getContext()).to.be.eql({a: 1});
      expect(message.getLevel()).to.be.eql(logger.LEVELS.TRACE);
      expect(message.getDate()).to.be.an.instanceof(Date);
      expect(message.getError()).to.be.null;
      done();
    });

    logger.trace({a:1}, 'Hello');
  });

  it('retrieves additional statistics about the system', (done) => {
    const logger = new Logger({
      withStats: true
    });

    logger.on('write', (message) => {
      expect(message.getContext()).to.not.be.eql({a: 1});
      const context = message.getContext();
      expect(context)
        .to.have.property('a')
        .and.to.be.eql(1);
      expect(context).to.have.property('stats');
      expect(context.stats).to.have.property('memory');
      expect(context.stats).to.have.property('freemem');
      expect(context.stats).to.have.property('totalmem');
      expect(context.stats).to.have.property('loadavg');
      done();
    });

    logger.info({a:1}, 'Hello');
  });

  it('allows to child the logger with additional context', () => {
    const logger = new Logger({
      withStats: true
    });

    const child = logger.child({
      context: {
        child: 1
      }
    });

    expect(child).to.be.an.instanceof(Logger);
    expect(child.context()).to.be.eql({
      child: 1
    });
  });

  it('allows to register additional streams', (done) => {
    const logger = new Logger({
      streams: [{
        name: 'test',
        stream: {
          write: function(message) {
            expect(message).to.be.a('string');
            done();
          }
        },
        serializer: serializerFactory.create('json')
      }]
    });

    logger.info({a:1}, 'Hello');
  });

  it('reads messages', (done) => {
    const logger = new Logger({
      streams: [{
        name: 'test',
        stream: {
          write: function(message) {
            expect(message).to.be.a('string');
            done();
          }
        },
        serializer: serializerFactory.create('json')
      }]
    });

    const message = { level: 30, context: {a: 1}, msg: 'Hello' }
    logger.emit('read', JSON.stringify(message));
  });

  it('supports bunyan serializer', (done) => {
    const logger = new Logger({
      streams: [{
        name: 'test',
        stream: {
          write: function(message) {
            expect(message).to.be.a('string');
            done();
          }
        },
        serializer: serializerFactory.create('bunyan')
      }]
    });

    logger.fatal(new Error('Custom error'), {a:1}, 'Hello');
  });

  it('supports bunyan serializer from message emission', (done) => {
    const logger = new Logger({
      streams: [{
        name: 'test',
        stream: {
          write: function(message) {
            expect(message).to.be.a('string');
            done();
          }
        },
        serializer: serializerFactory.create('bunyan')
      }]
    });

    const message = { level: 30, context: {a: 1}, msg: 'Hello' }
    logger.emit('read', JSON.stringify(message));
  });
});
