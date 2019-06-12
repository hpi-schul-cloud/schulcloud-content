// Initializes the `search` service on path `/search`
const createService = require('./search.class.js');
const hooks = require('./search.hooks');
const elasticsearch = require('elasticsearch');

module.exports = function() {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'search',
    paginate
  };

  const client = elasticsearch.Client({
    hosts:
      (process.env.ELASTIC_HOST || 'localhost') +
      ':' +
      (process.env.ELASTIC_PORT || '9200'),
    apiVersion: '5.4'
  });

  // Initialize our service with any options it requires
  app.use('/search', createService(client, options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('search');

  service.hooks(hooks);
};
