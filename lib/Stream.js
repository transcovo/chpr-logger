'use strict';

class Stream {
  constructor(options) {
    options = options || {};
    this.level = options.level || 0;
    this.filter = options.filter || null;
    this.stream = options.stream || process.stdout;
    this.serializer = options.serializer;
  }




  write(message) {
    if (this.mustWrite(message)) {
      const entry = this.serializer.serialize(message);
      this.stream.write(entry + "\n");
    }

    return true;
  }

  mustWrite(message) {
    let level = this.level;
    if (!Array.isArray(level)) level = [level, 101];

    // Check the log level criteria:
    const levelCriteria = message.getLevel() >= level[0] && message.getLevel() < level[1];

    // Check the filter criteria:
    const filterCriteria = typeof(this.filter) === 'function' ? this.filter(message) : true;

    return levelCriteria && filterCriteria;
  }





  read(message) {
    const entry = this.serializer.deserialize(message);
    if (this.mustRead(entry)) {
      return entry;
    }

    return false;
  }

  mustRead(message) {
    let level = this.level;
    if (!Array.isArray(level)) level = [level, 101];

    // Check the log level criteria:
    const levelCriteria = message.level >= level[0] && message.level < level[1];

    return levelCriteria;
  }
}

module.exports = Stream;
