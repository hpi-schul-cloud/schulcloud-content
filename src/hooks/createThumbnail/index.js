const config = require('config'); // https://www.npmjs.com/package/config
const errors = require('feathers-errors');
const rpn = require('request-promise-native');
const url = require('url')

const thumbnailConfiguration = config.get('thumbnailservice');

// todo run once at startup instead
function checkConfig() {
  return new Promise((resolve, reject) => {
    if (thumbnailConfiguration.enabled !== true) {
      reject('thumbnail service not enabled');
    }
    var urlRegex = new RegExp(expression);
    if (process.env.PICHASSO_URL) {
      thumbnailConfiguration.pichassoUrl = process.env.PICHASSO_URL;
    }
    if (!url.parse(thumbnailConfiguration.pichassoUrl)) {
      reject('check pichassoUrl in thumbnailservice configuration section ');
    }
    if (!thumbnailConfiguration.token) {
      reject('authentication token missing in thumbnailservice configuration section')
    }
    resolve();
  });
}

const api = rpn.defaults({
  baseUrl: thumbnailConfiguration.pichassoUrl,
  resolveWithFullResponse: true
});

/**
 * generates a thumbnail url for a running pichasso instance
 * the thumbnail will be generated on request
 * @param {*} hook 
 */
function createThumbnail(hook) {
  return new Promise((resolve, reject) => {
    if (thumbnailConfiguration.enabled !== true ||
      !data.thumbnailOptions ||
      data.thumbnailOptions.generate !== true) {
      return hook;
    }
    const dataUrl = encodeURIComponent(hook.data.url);
    return new Promise((res, rej) => {
      return checkConfig();
    }).then(() => {
      // request public authorization token with secret token from configuration
      const verifyUrl = url.resolve(thumbnailConfiguration.pichassoUrl,
        `/thumbnail/verify/${thumbnailConfiguration.token}/${dataUrl}`);
      return api.get(verifyUrl);
    }).then(response => {
      // check response
      if (response.status !== 'ok') { // todo
        console.error('verification failed getting thumbnail url', response);
        rej('verification failed getting thumbnail url');
      }
      return response.text; // todo
    }).then(token => {
      // add thumbnail url to resource model
      const thumbnailUrl = url.resolve(thumbnailConfiguration.pichassoUrl,
        `/thumbnail?auth=${token}&file=${dataUrl}`);
      hook.data.thumbnail = thumbnailUrl;
      return hook;
    });
  }).catch(err => {
    console.error('thumbnail url generation failed:', err);
    throw new errors.GeneralError(err);
  });;
}

module.exports = createThumbnail;
