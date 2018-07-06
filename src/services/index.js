const resource = require('./resource/resource.service.js');
const search = require('./search/search.service.js');
const user = require('./user/user.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(resource);
  app.configure(search);
  app.configure(user);
};
