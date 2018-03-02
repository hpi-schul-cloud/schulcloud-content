const resource = require('./resource/resource.service.js');
const rating = require('./rating/rating.service.js');
const search = require('./search/search.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(resource);
  app.configure(rating);
  app.configure(search);
};
