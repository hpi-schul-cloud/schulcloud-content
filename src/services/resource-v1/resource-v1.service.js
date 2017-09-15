// Initializes the `content` service
const createService = require('feathers-mongoose');
const createModel = require('../../models/resource.model');
const hooks = require('./resource-v1.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'resource-v1',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/v1/resources', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('/v1/resources');

  service.hooks(hooks);
};

