const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');
const createThumbnail = require('../../hooks/createThumbnail');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [authenticate, validateResourceSchema(), createThumbnail],
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
