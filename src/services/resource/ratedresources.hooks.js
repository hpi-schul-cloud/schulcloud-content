const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');
const getRatingHook = require('../../hooks/get-rating-hook');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [authenticate, validateResourceSchema()],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [getRatingHook.find],
    get: [getRatingHook.get],
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
