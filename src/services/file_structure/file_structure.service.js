// Initializes the `content` service on path `/content`
const createService = require('feathers-mongoose');
const createModel = require('../../models/file_structure.model');
const hooks = require('./file_structure.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'file_structure',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/file_structure', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('file_structure');

  service.hooks(hooks);
};

