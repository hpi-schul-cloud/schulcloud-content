const feathersES = require('feathers-elasticsearch');

class Service {

  constructor (esClient, options) {
    this.esClient = esClient;
    this.options = options || {};
  }

  find (params) {
    var query = params.query.query;
    return this.esClient.search({
      index: 'schulcloud_content',
      type: 'resources',
      body: {
        query: {
          bool: {
            must: [
              {"match": {"providerName": "Schul-Cloud"}},
              {"match": {"subjects": query.subject}},
              {"range" :
            		{
		            	"age" : {
		                	"gte" : query.age - 1,
			                "lte" : query.age + 2
			            }
		        	  }
            	}
            ]
          }
        }
      }
    });
  }
}

module.exports = function (esClient, options) {
  return new Service(esClient, options);
};

module.exports.Service = Service;
