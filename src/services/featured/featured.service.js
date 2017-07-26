const createService = require('./featured.class.js');

module.exports = function () {
  const app = this;
  const options = {
    name: 'featured',
    app
  };
  // Initialize our service with any options it requires
  app.use('/featured', createService(options));
};
