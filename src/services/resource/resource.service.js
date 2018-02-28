// Initializes the `resources` service on path `/resources`
const createService = require('feathers-mongoose');
const createResourceModel = require('../../models/resource-model');
const createRatingModel = require('../../models/rating-model');
const hooks = require('./resource.hooks');

module.exports = function() {
  const app = this;
  const paginate = app.get('paginate');

  const resourceModel = createResourceModel(app);
  const ratingModel = createRatingModel(app);

  // Initialize our service with any options it requires
  app.use('/resources', createService({ name: 'resources', Model: resourceModel, paginate }));
  app.use('/ratings', createService({ name: 'ratings', Model: ratingModel, paginate }));

  // Get our initialized service so that we can register hooks and filters
  const resourceService = app.service('resources');
  const ratingService = app.service('ratings');

  resourceService.hooks(hooks);
  // ratingService.hooks(hooks); //TODO
};
