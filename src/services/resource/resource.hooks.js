const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const resourceHooks = require('../../hooks/resources/');
const authenticate = require('../../hooks/authenticate');
const createThumbnail = require('../../hooks/createThumbnail');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [validateResourceSchema()], //authenticate, createThumbnail
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
