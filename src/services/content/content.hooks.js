const validateResourceSchema = require('../../hooks/validate-resource-schema/');

function authenticate(hook) {

  const basicAuth = require('basic-auth');
  const api = require('../../hooks/authenticate/api');

  // Parse Auth Header
  return new Promise((res, rej) => {
    let credentials = basicAuth.parse(hook.params.req.headers['authorization']);
    credentials ? res(credentials) : rej();
  })
  // Authenticate against Server
    .then(credentials => {
      return api.post('/authentication', {
        json: {
          username: credentials.name,
          password: credentials.pass
        }
      });
      // Parse JWT Token and set UserID
    }).then(data => {
      const jwtDecode = require('jwt-decode');
      const jwtTokenDecoded = jwtDecode(data.accessToken);
      hook.data.userId = jwtTokenDecoded.userId;
      return hook;
      // Auth Error
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
