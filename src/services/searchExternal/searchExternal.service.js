// Initializes the `search` service on path `/search`
const createService = require('./searchExternal.class.js');
const hooks = require('./searchExternal.hooks');
const filters = require('./searchExternal.filters');
const elasticsearch = require('elasticsearch');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'searchExternal',
    paginate
  };

  const client = elasticsearch.Client({
    hosts: process.env.ELASTICSEARCH_URI || 'elasticsearch:9200',
    apiVersion: '5.4'
  });

  // Initialize our service with any options it requires
  app.use('/searchExternal', createService(client, options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('searchExternal');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
