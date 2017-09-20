const feathersErrors = require('feathers-errors');

class Service {
  constructor (esClient, options) {
    this.esClient = esClient;
  }

  find (params) {
    if (params.esQuery == undefined) {
      throw new feathersErrors.GeneralError("The hook.params.esQuery must be set!.");
    }
    let search = this.esClient.search(params.esQuery);
    return Promise.resolve(search);
  }
}

module.exports = function (esClient) {
  return new Service(esClient);
};

module.exports.Service = Service;
