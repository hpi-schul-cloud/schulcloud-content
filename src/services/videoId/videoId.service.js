/*
  This service is used to allow temporary access via registered tokens to resources
*/

const createService = require('feathers-mongoose');
const createModel = require('../../models/videoId.model');
const hooks = require('./videoId.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'accessTokenService',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/videoId', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('videoId');

  service.hooks(hooks);
};
