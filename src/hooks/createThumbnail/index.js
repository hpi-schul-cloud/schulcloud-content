const errors = require('@feathersjs/errors');
const rpn = require('request-promise-native');
const url = require('url');

const api = rpn.defaults({
  resolveWithFullResponse: true
});

/**
 * generates a thumbnail url for a running pichasso instance
 * the thumbnail will be generated on request
 * @param {*} hook
 */
function createThumbnail(hook) {

  // Check Pichasso is activated && there no thumbnail is present
  let pichassoConfiguration = hook.app.get('pichasso');
  if (pichassoConfiguration.enabled !== true || hook.data.thumbnail) {
    return hook;
  }

  // Check Pichasso is configured
  if(!pichassoConfiguration.url || !url.parse(pichassoConfiguration.url) || !pichassoConfiguration.token) {
    return hook;
  }

  // Request public authorization token with secret token from configuration
  const dataUrl = encodeURIComponent(hook.data.url);
  const verifyUrl = url.resolve(pichassoConfiguration.url,
    `/thumbnail/verify/${pichassoConfiguration.token}/${dataUrl}`);
  return api.get(verifyUrl).then(response => {

    // Check response
    if (response.statusCode !== 200) {
      return Promise.reject('verification failed getting thumbnail url');
    }
    // Check token
    let token = response.body;
    if(!token || token.length !== 6){
      return Promise.reject('received token seems to be wrong');
    }

    // Add thumbnail url to resource model
    hook.data.thumbnail = url.resolve(pichassoConfiguration.url,
      `/thumbnail?auth=${token}&file=${dataUrl}`);
    return hook;
  }).catch(err => {
    throw new errors.GeneralError(err);
  });
}

module.exports = createThumbnail;
