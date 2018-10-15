const feathersES = require('feathers-elasticsearch');

class Service {

  constructor (esClient, options) {
    this.esClient = esClient;
    this.options = options || {};
  }

  find (params) {
    var query = params.query;
    var options = getDefaultOptions(query);
    console.log(params.query.task);
    switch (params.query.task) {
      case "review":
        options = getReviewOptions(query, options);
        break;
      case "search":
        options = getSearchOptions(query, options);
        break;
      case "my-content":
        options = getMyContentOptions(query, options);
        break;
      default:
        options = getOptions(query);
    }

    return this.esClient.search(options);
  }
}

module.exports = function (esClient, options) {
  return new Service(esClient, options);
};

module.exports.Service = Service;

getOptions = function(query) {
  var options = getDefaultOptions(query);
  options = getFilter(query, options);
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
          must_not: [],
          should: []
        }
      }
    }
  };

  if (query.term) {
    options.body.query.bool.must.push(
      {"multi_match" :
        {
          "query": query.term,
          "fields": [ "title", "description", "content", "topics", "tags" ]
        }
      }
    );
  }

  return options;
}

getReviewOptions = function(query, options) {
  console.log("review");
  options.body.query.bool.must_not.push({"match" : {"approved": true}}); // no approved content
  options.body.query.bool.must_not.push({"match" : { "userId": query.userId }}); // user can't review own content
  options.body.query.bool.must_not.push({"match" : { "isPrivat": true }}); // only published content
  options.body.query.bool.must_not.push({"match" : { "ratings.userId" : query.userId }}) // Don't show content that has been rated by userId before
  console.log(query.userId);
  return getFilter(query, options);
}

getMyContentOptions = function(query, options) {
  options.body.query.bool.must.push({"match" : { "userId": query.userId } }); // only own content
  return getFilter(query, options);
}

getSearchOptions = function(query, options) {
  options.body.query.bool.must_not.push({"match" : { "isPrivat": true }}); // only published content
  // options.body.query.bool.should.push({'match': {'approved': true}});
  options.body.query.bool.should = [{
        "bool": {
          "must_not": [{
            "match": {
              'providerName': "Schul-Cloud"
            }
          }]
        }
      }, {
        "bool": {
          "must": [{
            "match": {
              'approved': true
            }
          }]
        }
      }]
  // options.body.query.bool.should.push({
  //   'bool': {
  //     'must_not': [
  //       {'match': {'providerName': "Schul-Cloud"}}
  //     ],
  //     'must': [
  //       {'match': {'approved': true}}
  //     ]
  //   }
  // }); // only approved or external content TODO: is this working?

  return getFilter(query, options);
}

getFilter = function(query, options) {

  // Default: Don't show denied content
  if (!query.showDenied && query.task !== "my-content") {
    options.body.query.bool.must_not.push({"match" : { "denied": true } });
  }

  if (query.provider) {
    options.body.query.bool.must.push(
      {"match" : { "providerName": query.provider } }
    );
  }

  if (query.approved) {
    options.body.query.bool.must.push(
      {"match" : { "approved": true } }
    );
  }

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
