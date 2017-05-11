// Initializes the `content` service on path `/content`
const createService = require('feathers-mongoose');
const createModel = require('../../models/content.model');
const hooks = require('./content.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'content',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/content', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('content');

  service.hooks(hooks);
};
