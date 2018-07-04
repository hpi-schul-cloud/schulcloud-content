// Initializes the `search` service on path `/search`
const createService = require('./searchInternal.class.js');
const hooks = require('./searchInternal.hooks');
const filters = require('./searchInternal.filters');
const elasticsearch = require('elasticsearch');

module.exports = function () {
  const app = this;
  const paginate = app.get('paginate');

  const options = {
    name: 'searchInternal',
    paginate
  };

  const client = elasticsearch.Client({
    hosts: process.env.ELASTICSEARCH_URI || 'elasticsearch:9200',
    apiVersion: '5.4'
  });

  console.log("Initialize searchInternal service");
  // Initialize our service with any options it requires
  app.use('/searchInternal', createService(client, options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('searchInternal');

  service.hooks(hooks);

  if (service.filter) {
    service.filter(filters);
  }
};
