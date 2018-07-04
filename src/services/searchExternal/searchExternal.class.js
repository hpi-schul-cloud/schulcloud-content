const feathersES = require('feathers-elasticsearch');

class Service {

  constructor (esClient, options) {
    this.esClient = esClient;
    this.options = options || {};
  }

  find (params) {
    console.log("inside searchExternal");
    console.log(params);
    let service = feathersES({
      Model: this.esClient,
      paginate: this.options.paginate,
      elasticsearch: {
        index: 'schulcloud_content',
        type: 'resources'
      }
    });
    return service.find(params);
  }
}

module.exports = function (esClient, options) {
  return new Service(esClient, options);
};

module.exports.Service = Service;
