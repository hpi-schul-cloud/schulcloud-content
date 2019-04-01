// Initializes the `content` service on path `/content`
const createService = require('feathers-mongoose');
const createModel = require('../../models/resource_filepaths.model');
const hooks = require('./resource_filepaths.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'resource_filepaths',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/resource_filepaths', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('resource_filepaths');

  service.hooks(hooks);
};

