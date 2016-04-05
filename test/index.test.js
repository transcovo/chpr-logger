'use strict';

const Message = require(`${path.root}/lib/Message`);

const logger = require(`${path.root}/index`);

describe('index.js', () => {
  it('exposes a logger ready to log', (done) => {
    logger.on('write', (message) => {
      expect(message).to.be.instanceof(Message);
      expect(message.getMessage()).to.be.eql('Hello');
      expect(message.getContext()).to.be.eql({a: 1});
      expect(message.getLevel()).to.be.eql(logger.LEVELS.INFO);
      expect(message.getDate()).to.be.an.instanceof(Date);
      expect(message.getError()).to.be.null;
      done();
    });
    logger.info({a: 1}, 'Hello');
  });
});
