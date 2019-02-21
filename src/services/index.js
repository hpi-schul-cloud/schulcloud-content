const files = require('./files/files.service.js');
const resource = require('./resource/resource.service.js');
const search = require('./search/search.service.js');
const user = require('./user/user.service.js');
const reserved_Ids = require('./reserved_Ids/reserved_Ids.service.js');
const content_filepaths = require('./content_filepaths/content_filepaths.service.js');

module.exports = function () {
  const app = this;
  app.configure(files);
  app.configure(resource);
  app.configure(search);
  app.configure(user);
  app.configure(reserved_Ids);
  app.configure(content_filepaths);
};
