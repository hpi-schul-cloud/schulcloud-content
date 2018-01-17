const config = require('config'); // https://www.npmjs.com/package/config
const errors = require('feathers-errors');
const rpn = require('request-promise-native');
const url = require('url');

const thumbnailConfiguration = config.get('thumbnailservice');

const api = rpn.defaults({
  resolveWithFullResponse: true
});

/**
 * generates a thumbnail url for a running pichasso instance
 * the thumbnail will be generated on request
 * @param {*} hook
 */
function createThumbnail(hook) {
  const dataUrl = encodeURIComponent(hook.data.url);
  if (thumbnailConfiguration.enabled !== true ||
    !hook.data.thumbnailOptions ||
    hook.data.thumbnailOptions.generate !== true) { 
      // ignore thumbnail creation if not enabled in config or hook.data
    return hook;
  }
  return new Promise((resolve, reject) => {
    // check configuration
    if (process.env.PICHASSO_URL) {
      thumbnailConfiguration.pichassoUrl = process.env.PICHASSO_URL;
    }
    if (!url.parse(thumbnailConfiguration.pichassoUrl)) {
      reject('check pichassoUrl in thumbnailservice configuration section ');
    }
    if (!thumbnailConfiguration.token) {
      reject('token value missing in thumbnailservice configuration section');
    }
    resolve();
  }).then(() => {
    // request public authorization token with secret token from configuration
    const verifyUrl = url.resolve(thumbnailConfiguration.pichassoUrl,
      `/thumbnail/verify/${thumbnailConfiguration.token}/${dataUrl}`);
    return api.get(verifyUrl);
  }).then(response => {
    // check response
    if (response.statusCode !== 200) { 
      Promise.reject('verification failed getting thumbnail url');
    }
    return response.body; 
  }).then(token => {
    // add thumbnail url to resource model
    if(!token || token.length !== 6){
      Promise.reject('received token seems to be wrong');
    }
    const thumbnailUrl = url.resolve(thumbnailConfiguration.pichassoUrl,
      `/thumbnail?auth=${token}&file=${dataUrl}`);
    hook.data.thumbnail = thumbnailUrl;
    return hook;
  }).catch(err => {
    throw new errors.GeneralError(err);
  });
}

module.exports = createThumbnail;
