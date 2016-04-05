'use strict';

const chai = require('chai');

/**
 * Load all necessary modules for the tests.
 */

global.nock = require('nock');
global.chai = chai;
global.expect = chai.expect;
global.should = chai.should;
global.assert = chai.assert;

global.path = {
  root: `${__dirname}/..`,
  tests: __dirname
};
