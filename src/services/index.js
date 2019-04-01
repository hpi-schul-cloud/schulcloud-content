const access_token = require('./access_token/access_token.service.js');
const files = require('./files/files.service.js');
const resource = require('./resource/resource.service.js');
const search = require('./search/search.service.js');
const user = require('./user/user.service.js');
const content_filepaths = require('./content_filepaths/content_filepaths.service.js');

module.exports = function () {
  const app = this;
  app.configure(access_token);
  app.configure(files);
  app.configure(resource);
  app.configure(search);
  app.configure(user);
  app.configure(content_filepaths);
};
