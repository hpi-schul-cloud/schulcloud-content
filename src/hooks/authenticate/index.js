const basicAuth = require('basic-auth');
const rpn = require('request-promise-native');
const cache = require('memory-cache');
const errors = require('@feathersjs/errors');

// Cache Successful Logins for 30 Seconds
const TOKEN_CACHE_TIME = 30000;

// Backend for Authentication
const api = rpn.defaults({
  baseUrl: process.env.BACKEND_URL || 'http://localhost:3030/',
  resolveWithFullResponse: true
});

function checkLocalAuthentication(username, password) {
  const config = require('config');
  const localUsers = config.get('localAuthentication');
  return localUsers.find(user => { return user.username === username && user.password === password; });
}

function remoteAuthentication(username, password) {

  // Check for cached token
  let key = `${username}:${password}`;
  let token = checkForCachedToken(key);
  if (token) {
    return Promise.resolve({ accessToken: token, cached: true });
  }

  // Make actual API call
  return api.post('/authentication', {
    json: {
      username: username,
      password: password
    },
    transform: (body, response) => {
      response.accessToken = body.accessToken;
      response.cachedKey = key;
      return response;
    }
  });
}

function checkForCachedToken(key) {
  let cachedToken = cache.get(key);
  if(cachedToken) {
    return { accessToken: cachedToken, cached: true};
  }
  return false;
}

function cacheToken(key, accessToken, cacheTime = TOKEN_CACHE_TIME) {
  cache.put(key, accessToken, cacheTime);
}

function parseJwtToken(token) {
  // Parse JWT Token and set UserID
  const jwtDecode = require('jwt-decode');
  const jwtTokenDecoded = jwtDecode(token);
  return jwtTokenDecoded.userId;
}

/**
 *
 */
function authenticateHook(hook) {

  // skip for internal calls
  if(typeof (hook.params.provider) === 'undefined'){
    return hook;
  }

  let authHeader = (((hook.params||{}).req||{}).headers||{})['authorization'];

  // gracefully exits instead of checking undefined variable
  if (!authHeader) { throw new errors.NotAuthenticated('Could not authenticate! Missing auth header'); }

  if(!hook.data){ hook.data = {}; }
  // prevent userId injection
  if(hook.data.userId){
    delete hook.data.userId;
  }

  // JWT AUTH
  // TODO: Validate JWT Token against Server
  // TODO: Error Handling
  if(authHeader.startsWith('Bearer ')) {
    hook.data.userId = parseJwtToken(authHeader);
    return hook;
  }

  // BASIC AUTH
  if(authHeader.startsWith('Basic ')) {

    let credentials = basicAuth.parse(authHeader);

    // gracefully exits instead of checking undefined variables
    if (!credentials) { throw new errors.NotAuthenticated('Could not authenticate! Missing username and/or password'); }

    // Check Local Auth
    let localUser = checkLocalAuthentication(credentials.name, credentials.pass);
    if(localUser) {
      // check hook.data is available
      hook.data.userId = localUser.userId;
      return hook;
    }

    // Otherwise Remote Auth
    return remoteAuthentication(credentials.name, credentials.pass).then(response => {
      // Cache Token
      if(!response.cached) {
        cacheToken(response.cachedKey, response.accessToken);
      }
      // Extract Token
      let userId = parseJwtToken(response.accessToken);
      // check hook.data is available
      if(hook.data) { hook.data.userId = userId; }
      return hook;
    }).catch(() => {
      // TODO: Show Error in Response
      throw new errors.NotAuthenticated('Could not authenticate');
    });
  }

  // Otherwise
  throw new errors.NotAuthenticated('Could not authenticate. We are currently supporting Basic- and Bearer Token Auth.');
}

module.exports = authenticateHook;
