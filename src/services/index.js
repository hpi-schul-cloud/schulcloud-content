const files = require('./files/files.service.js');
const resource = require('./resource/resource.service.js');
const search = require('./search/search.service.js');
const user = require('./user/user.service.js');

module.exports = function () {
  const app = this;
  app.configure(files);
  app.configure(resource);
  app.configure(search);
  app.configure(user);
};
