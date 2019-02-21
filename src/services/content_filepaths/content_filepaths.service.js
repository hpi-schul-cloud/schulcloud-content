// Initializes the `content` service on path `/content`
const createService = require('feathers-mongoose');
const createModel = require('../../models/content_filepaths.model');
const hooks = require('./content_filepaths.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'content_filepaths',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/content_filepaths', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('content_filepaths');

  service.hooks(hooks);
};

