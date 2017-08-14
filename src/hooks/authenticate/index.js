const cache = require('memory-cache');
const basicAuth = require('basic-auth');
const rpn = require('request-promise-native');

// Cache Successful Logins for 30 Seconds
const TOKEN_CACHE_TIME = 30000;

const api = rpn.defaults({
  baseUrl: process.env.BACKEND_URL || 'http://localhost:3030/',
  resolveWithFullResponse: true
});

function authenticateHook(hook) {
  // Parse Auth Header
  return new Promise((res, rej) => {
    let credentials = basicAuth.parse(hook.params.req.headers['authorization']);
    credentials ? res(credentials) : rej();
  }).then(credentials => {
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
    // Parse JWT Token and set UserID
    const jwtDecode = require('jwt-decode');
    const jwtTokenDecoded = jwtDecode(response.accessToken);
    hook.data.userId = jwtTokenDecoded.userId;
    // Cache Token
    if(!response.cached) {
      cache.put(response.cachedKey, response.accessToken, TOKEN_CACHE_TIME);
    }
    return hook;
  }).catch(_ => {
    // Auth Error
    const errors = require('feathers-errors');
    throw new errors.NotAuthenticated('Could not authenticate');
  });
}

module.exports = authenticateHook;
