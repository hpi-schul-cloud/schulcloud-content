const resource = require('./resource/resource.service.js');
const resourcev1 = require('./resource-v1/resource-v1.service.js');
const search = require('./search/search.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(resource);
  app.configure(resourcev1);
  app.configure(search);
};
