const find = require('./find.js');
const get = require('./get.js');

/**
 *
 * @param hook
 */
function globalBefore(hook) {
}

/**
 *
 * @param hook
 */
function globalAfter(hook) {
}

/**
 *
 * @param hook
 * @returns {boolean}
 */
function checkIfRequestIsJsonApi(hook) {

  // Check req-object is present
  // TODO: Implement me!

  // Servers MUST respond with a 415 Unsupported Media Type status code if a request specifies the header Content-Type: application/vnd.api+json with any media type parameters.
  // TODO: Implement me!

  // Check for JSON-API Header
  if(hook.params.req && hook.params.req.headers['content-type']
    !== 'application/vnd.api+json') {
    return false;
  }

  return true;
}

/**
 *
 * @param options
 * @returns {Function}
 */
module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return function (hook) {

    // Check request is json-api, or jsonapify ran before
    let isFirstJsonapifyCall = false;
    if(typeof hook.jsonapify === 'undefined') {
      hook.jsonapify = checkIfRequestIsJsonApi(hook);
      isFirstJsonapifyCall = true;
    }
    if(hook.jsonapify !== true) {
      return Promise.resolve(hook);
    }

    // Run global hook functions
    if(hook.type === 'before') {
      globalBefore(hook);
    } else if(hook.type === 'after') {
      globalAfter(hook);
    }

    switch (hook.method){
      case 'find':
        find(hook);
        break;
      case 'get':
        get(hook);
        break;
      case 'create':
        break;
      case 'update':
        break;
      case 'patch':
        break;
      case 'remove':
        break;
    }

    // First jsonapify call did run
    hook.jsonapify = true;

    return Promise.resolve(hook);
  };
};
