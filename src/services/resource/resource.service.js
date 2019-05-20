// Initializes the `resources` service on path `/resources`
const createService = require('feathers-mongoose');
const createModel = require('../../models/resource.model');
const hooks = require('./resource.hooks');

const { ResourceSchemaService } = require('./resource_getResourceSchema.service.js');
const { ResourceBulkService } = require('./resource_bulk.service.js');


module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'resources',
    Model,
    paginate,
    multi: true,
  };

  // delivers resource schema for frontend validation
  app.use('/resources/resource-schema',  new ResourceSchemaService(app));

  // same as /resources but for multiple edits at once
  app.use('/resources/bulk',  new ResourceBulkService(app));
  const bulkService = app.service('resources/bulk');
  bulkService.hooks(hooks);

  // Initialize our service with any options it requires
  app.use('/resources', createService(options));
  // Get our initialized service so that we can register hooks and filters
  const service = app.service('resources');
  service.hooks(hooks);
};
