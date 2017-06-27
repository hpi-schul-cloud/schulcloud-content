const rpn = require('request-promise-native');

const api = rpn.defaults({
  baseUrl: process.env.BACKEND_URL || 'http://localhost:3030/'
});

module.exports = api;
