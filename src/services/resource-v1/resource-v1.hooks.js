const validateResourceSchema = require('../../hooks/validate-resource-schema-v1/');
const authenticate = require('../../hooks/authenticate');


// https://docs.feathersjs.com/api/hooks.html#application-hooks
module.exports = {
  before: {
    all: [function(hook){console.log('before all hook ran');}],
    find: [],
    get: [],
    create: [
      function(hook){console.log('create 1');},
      validateResourceSchema(),
      authenticate,
      function(hook){console.log('create 2');}
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
