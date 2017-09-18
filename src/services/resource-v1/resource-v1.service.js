// Initializes the `content` service
const createService = require('feathers-mongoose');
const createModel = require('../../models/resource.model');
const hooks = require('./resource-v1.hooks');
const rest = require('feathers-rest');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = {'default': 10000000, 'max': 10000000};

  const options = {
    name: 'resource-v1',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/v1/resources/ids', createService(options));
  app.use('/v1/resources', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service1 = app.service('/v1/resources/ids');
  const service2 = app.service('/v1/resources');

  service1.hooks(hooks);
  service2.hooks(hooks);
};

