// Initializes the `content` service on path `/content`
const createService = require('feathers-mongoose');
const createModel = require('../../models/reserved_Ids.model');
const hooks = require('./reserved_Ids.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'reserved_Ids',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/reserved_Ids', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('reserved_Ids');

  service.hooks(hooks);
};