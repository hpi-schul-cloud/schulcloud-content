// Initializes the `search` service on path `/search`
const createService = require('./search.class.js');
const hooks = require('./search.hooks');
const elasticsearch = require('elasticsearch');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'search-v1',
    paginate
  };

  const client = elasticsearch.Client({
    hosts: 'elastic:changeme@elasticsearch:9200'
  });

  // Initialize our service with any options it requires
  app.use('/v1/search', createService(client));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('/v1/search');

  service.hooks(hooks);

};
