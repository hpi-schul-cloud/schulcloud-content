// Initializes the `resources` service on path `/resources`
const createService = require('feathers-mongoose');
const createResourceModel = require('../../models/resource-model');
const resourceHooks = require('./resource.hooks');
const ratedResourceHooks = require('./ratedresources.hooks');

module.exports = function() {
  const app = this;
  const paginate = app.get('paginate');
  const resourceModel = createResourceModel(app);

  // Initialize our service with any options it requires
  const mongooseService = createService({ name: 'resources', Model: resourceModel, paginate });
  app.use('/resources', mongooseService);
  app.use('/ratedresources', mongooseService);

  // Get our initialized service so that we can register hooks and filters
  app.service('resources').hooks(resourceHooks);
  app.service('ratedresources').hooks(ratedResourceHooks);
};
