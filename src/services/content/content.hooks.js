const validateResourceSchema = require('../../hooks/validate-resource-schema/');

function authenticate(hook) {

  const basicAuth = require('basic-auth');
  const credentials = basicAuth.parse(hook.params.req.headers['authorization']);

  const api = require('../../hooks/authenticate/api');
  return api.post('/authentication', {
    json: {
      username: credentials.name,
      password: credentials.pass
    }
  }).then(data => {
    const jwtDecode = require('jwt-decode');
    return jwtDecode(data.accessToken);
  }).then(_ => {
    // TODO: Authorization
    return hook;
  }).catch(_ => {
    const errors = require('feathers-errors');
    throw new errors.NotAuthenticated('Could not authenticate');
  });
}

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
