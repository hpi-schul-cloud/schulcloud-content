const access_token = require('./access_token/access_token.service.js');
const files = require('./files/files.service.js');
const resource = require('./resource/resource.service.js');
const redirect = require('./redirect/redirect.service.js');
const search = require('./search/search.service.js');
const user = require('./user/user.service.js');
const resource_filepaths = require('./resource_filepaths/resource_filepaths.service.js');
const videoId = require('./videoId/videoId.service.js');
const drm = require('./drm/drm.service.js');

module.exports = function() {
  const app = this;
  app.configure(access_token);
  app.configure(files);
  app.configure(resource);
  app.configure(redirect);
  app.configure(search);
  app.configure(user);
  app.configure(resource_filepaths);
  app.configure(videoId);
  app.configure(drm);
};
