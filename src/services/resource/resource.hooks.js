const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');
const jsonapify = require('../../hooks/jsonapify/index');

function setUserId(hook) {
  hook.data.userId = hook.params.user.id;
}

module.exports = {
  before: {
    all: [jsonapify()],
    find: [],
    get: [],
    create: [authenticate, validateResourceSchema(), setUserId],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [jsonapify()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [jsonapify()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
