const feathersErrors = require('feathers-errors');
const toJSONAPIError = require('../../hooks/toJsonapiError');
const jsonapi = require("../../jsonapi-response");
const convert = require("../../jsonapi-content-type");

function invalidMethod(hook) {
  throw new feathersErrors.MethodNotAllowed("Sorry, but this is not implemented.");
}

function createElastisearchParameters(hook) {
  console.log("createElastisearchParameters: ", hook.params.query);
  hook.params.esQuery = {q: hook.params.query.Q};
}

function convertSearchObjectToResource(object, root) {
  console.log("convertSearchObjectToResource:", object._source);
  return convert.convertResource(object._source, root);
}

function convertElastisearchResult(hook) {
  var search = hook.result;
  var root = convert.getResourceRoot(hook.params.req);
  var objects = search.hits.hits.map(
    object => convertSearchObjectToResource(object, root));
  var result = {
    jsonapi: jsonapi,
    links: {
      self: {
        href: "",
        meta: {
          offset: 0,
          count: objects.length,
          limit: objects.length
        }
      },
      next: null,
      last: null,
      first: null,
      prev: null,
    },
    data: objects
  };
  hook.result = hook.data = result;
}

module.exports = {
  before: {
    all: [],
    find: [createElastisearchParameters],
    get: [invalidMethod],
    create: [invalidMethod],
    update: [invalidMethod],
    patch: [invalidMethod],
    remove: [invalidMethod]
  },

  after: {
    all: [],
    find: [function(hook){console.log("after find", hook.result)}, convertElastisearchResult],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [toJSONAPIError],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
