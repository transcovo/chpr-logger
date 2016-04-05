'use strict';

const os = require('os');

const extend = require('util')._extend;

// REF: https://github.com/trentm/node-bunyan/blob/master/lib/bunyan.js#L118
function copy(obj) {
  if (obj == null) { // null or undefined
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.slice();
  } else if (typeof(obj) === 'object') {
    var copy = {};
    Object.keys(obj).forEach(function(k) {
      copy[k] = obj[k];
    });
    return copy;
  } else {
    return obj;
  }
}

function isBrowser() {
  return typeof(window) !== 'undefined' && window.window === window;
}

function stats() {
  if (!isBrowser()) {
    return {
      memory: process.memoryUsage(),
      freemem: os.freemem(),
      totalmem: os.totalmem(),
      loadavg: os.loadavg()
    };
  }
  return {};
}

module.exports = {
  copy,
  extend,
  stats,
  isBrowser
};
