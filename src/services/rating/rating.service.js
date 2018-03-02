// Initializes the `rating` service on path `/ratings`
const createService = require('feathers-mongoose');
const createRatingModel = require('../../models/rating-model');
const hooks = require('./rating.hooks');

module.exports = function() {
  const app = this;
  const paginate = app.get('paginate');
  const ratingModel = createRatingModel(app);

  // Initialize our service with any options it requires
  app.use('/ratings', createService({ name: 'ratings', Model: ratingModel, paginate }));

  // Get our initialized service so that we can register hooks and filters
  const ratingService = app.service('ratings');

  // ratingService.hooks(hooks); //TODO
};
