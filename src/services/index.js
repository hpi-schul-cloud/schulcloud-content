const content = require('./content/content.service.js');
const search = require('./search/search.service.js');
const featured = require('./featured/featured.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(content);
  app.configure(search);
  app.configure(featured);
};
