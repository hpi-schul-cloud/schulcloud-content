const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const resourceHooks = require('../../hooks/resources/');
const authenticate = require('../../hooks/authenticate');

module.exports = {
  before: {
    all: [resourceHooks.test],
    find: [],
    get: [],
    create: [validateResourceSchema()], //authenticate, 
    update: [],
    patch: [resourceHooks.rate],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [resourceHooks.created],
    update: [],
    patch: [resourceHooks.isApproved],
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
