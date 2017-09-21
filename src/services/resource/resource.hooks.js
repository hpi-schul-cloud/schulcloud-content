const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');
const jsonapify = require('../../hooks/jsonapify/index');

function logData(hook) {
  console.log("logData: ", hook.data);
}

function setUserId(hook) {
  hook.data.userId = hook.params.user.id;
}

module.exports = {
  before: {
    all: [logData, jsonapify()],
    find: [],
    get: [],
    create: [authenticate, logData, validateResourceSchema(), setUserId],
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
