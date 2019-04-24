/*
  This service is used to allow temporary access via registered tokens to resources
*/

const createService = require('feathers-mongoose');
const createModel = require('../../models/access_token.model');
const hooks = require('./access_token.hooks');

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
  app.use('/access_token', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('access_token');

  service.hooks(hooks);
};
