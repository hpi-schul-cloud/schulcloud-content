// Initializes the `content` service on path `/content`
const createService = require('feathers-mongoose');
const createModel = require('../../models/teacherContent.model');
const hooks = require('./teacherContent.hooks');

module.exports = function () {
  const app = this;
  const Model = createModel(app);
  // Model.collection.dropIndexes(function(err, results) {
  //   console.log("Err:", err);
  //   console.log("Results:", results);
  // });
  const paginate = app.get('paginate');

  const options = {
    name: 'teacherContents',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/teacherContents', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('teacherContents');

  service.hooks(hooks);
};
