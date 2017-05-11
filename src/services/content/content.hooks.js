const validateResourceSchema = require('../../hooks/validate-resource-schema/');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [validateResourceSchema()],
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
