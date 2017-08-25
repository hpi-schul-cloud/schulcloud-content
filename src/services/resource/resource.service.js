// Initializes the `content` service on path `/content`
const createService = require('feathers-mongoose');
const createModel = require('../../models/resource.model');
const hooks = require('./resource.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'resources',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/resources', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('resources');

  service.hooks(hooks);
};
