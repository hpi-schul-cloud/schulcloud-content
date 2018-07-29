const feathersES = require('feathers-elasticsearch');

class Service {

  constructor (esClient, options) {
    this.esClient = esClient;
    this.options = options || {};
  }

  find (params) {
    var query = params.query;
    var options = getOptions(query);


    return this.esClient.search(options);
  }
}

module.exports = function (esClient, options) {
  return new Service(esClient, options);
};

module.exports.Service = Service;

getOptions = function(query) {
  var options = getDefaultOptions(query);
  options = getFilters(query, options);
  return options;
}

getDefaultOptions = function(query) {
  const limit = query.limit || 9;
  const skip = query.page ? (query.page - 1) * limit : 0;
  var options = {
    index: 'schulcloud_content',
    type: 'resources',
    body: {
      from: skip,
      size: limit,
      query: {
        bool: {
          must: [],
          must_not: []
        }
      }
    }
  };
  return options;
}

getFilters = function(query, options) {
  if (query.term) {
    options.body.query.bool.must.push(
      {"multi_match" :
        {
          "query": query.term,
          "fields": [ "title", "description", "content" ]
        }
      }
    );
  }

  if (query.provider) {
    options.body.query.bool.must.push(
      {"match" : { "providerName": query.provider } }
    );
  }

  if (query['only-approved']) {
    options.body.query.bool.must.push({"match": {"approved": true}});
  };

  if (query['only-non-approved']) {
    options.body.query.bool.must_not.push({"match": {"approved": true}});
  };

  if (query.subjects) {
    options.body.query.bool.must.push(
      {"match" : { "subjects": query.subjects } }
    );
  }

  if (query.goal) {
    options.body.query.bool.must.push(
      {"match" : { "goal": query.goal } }
    );
  }

  if (query.age) {
    const range = query.range || 1
    options.body.query.bool.must.push(
      {"range" :
        {
          "age" : {
              "gte" : query.age - range,
              "lte" : query.age + range
          }
        }
      }
    );
  }

  if (query.difficulty) {
    const range = query.range || 1
    options.body.query.bool.must.push(
      {"match" : { "difficulty": query.difficulty } }
    );
  }

  return options;
}
