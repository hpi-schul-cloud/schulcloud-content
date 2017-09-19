const cache = require('memory-cache');
const basicAuth = require('basic-auth');
const rpn = require('request-promise-native');
var config = require('config'); // https://www.npmjs.com/package/config

// Cache Successful Logins for 30 Seconds
const TOKEN_CACHE_TIME = 30000;

const api = rpn.defaults({
  baseUrl: process.env.BACKEND_URL || 'http://localhost:3030/',
  resolveWithFullResponse: true
});

var mongoose = require('mongoose');

var LOCAL_USERS = config.get('localAuthentication');
for (var i = 0; i < LOCAL_USERS.length; i+= 1) {
  var localUser = LOCAL_USERS[i];
  localUser.local = true;
  localUser.userId = mongoose.Types.ObjectId(localUser.userId);
}

function authenticateHook(hook) {
  // Parse Auth Header
  return new Promise((res, rej) => {
    let credentials = basicAuth.parse(hook.params.req.headers['authorization']);
    credentials ? res(credentials) : rej();
  }).then(credentials => {
    for (var i = 0; i < LOCAL_USERS.length; i+= 1) {
      var localUser = LOCAL_USERS[i];
      if (credentials.name == localUser.username) {
        if (credentials.pass == localUser.password) {
          return localUser;
        }
      }
    }
    // Create Key for Caching Tokens
    let key = `${credentials.name}:${credentials.pass}`;
    // Check for cached JWT Tokens
    let cachedToken = cache.get(key);
    if(cachedToken) {
      return { accessToken: cachedToken, cached: true};
    }
    // Otherwise Authenticate against Backend Server
    return api.post('/authentication', {
      json: {
        username: credentials.name,
        password: credentials.pass
      },
      transform: (body, response) => {
        response.accessToken = body.accessToken;
        response.cachedKey = key;
        return response;
      }
    });
  }).then(response => {
    if (response.local) {
      hook.params.user = {"id": response.userId};
      return hook;
    }
    // Parse JWT Token and set UserID
    const jwtDecode = require('jwt-decode');
    const jwtTokenDecoded = jwtDecode(response.accessToken);
    hook.params.user = {"id": jwtTokenDecoded.userId};
    // Cache Token
    if(!response.cached) {
      cache.put(response.cachedKey, response.accessToken, TOKEN_CACHE_TIME);
    }
    return hook;
  }).catch(error => {
    // Auth Error
    const errors = require('feathers-errors');
    throw new errors.NotAuthenticated('Could not authenticate', error && error.stack);
  });
}

module.exports = authenticateHook;
