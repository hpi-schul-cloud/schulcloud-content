const resource = require('./resource/resource.service.js');
const search = require('./search/search.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(resource);
  app.configure(search);
};
