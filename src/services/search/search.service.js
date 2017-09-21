// Initializes the `search` service on path `/search`
const createService = require('./search.class.js');
const hooks = require('./search.hooks');
const filters = require('./search.filters');
const elasticsearch = require('elasticsearch');
const createModel = require('../../models/resource.model');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');
  const Model = createModel(app);

  const options = {
    name: 'search',
    Model,
    paginate
  };

  const client = elasticsearch.Client({
    hosts: 'elastic:changeme@elasticsearch:9200'
  });

  // Initialize our service with any options it requires
  app.use('/search', createService(client, options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('search');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
