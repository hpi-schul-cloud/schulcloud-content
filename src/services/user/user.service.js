const userService = require('./user.class.js');
const hooks = require('./user.hooks.js');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'resourceuser',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/user/resources', new userService.Service(options, app));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('user/resources');
  service.hooks(hooks);
};
