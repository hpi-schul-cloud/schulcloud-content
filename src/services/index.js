const content = require('./content/content.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(content);
};
