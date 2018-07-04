// Initializes the `content` service on path `/content`
const createService = require('feathers-mongoose');
const createModel = require('../../models/proposal.model');
const hooks = require('./proposal.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'proposals',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/proposals', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('proposals');

  service.hooks(hooks);
};
