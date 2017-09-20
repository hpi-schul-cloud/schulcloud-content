class Service {
  constructor (esClient, options) {
    this.esClient = esClient;
    this.options = options || {};
  }

  find (params) {
    let search = this.esClient.search({
      q: params.query.Q
    });
    return Promise.resolve(search);
  }
}

module.exports = function (esClient, options) {
  return new Service(esClient, options);
};

module.exports.Service = Service;
