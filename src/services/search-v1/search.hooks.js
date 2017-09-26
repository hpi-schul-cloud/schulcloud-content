const feathersErrors = require('feathers-errors');
const toJSONAPIError = require('../../hooks/toJsonapiError');
const jsonapi = require("../../jsonapi-response");
const convert = require("../../jsonapi-content-type");
const qs = require("qs");
const checkContentNegotiation = require('../../hooks/checkContentNegotiation');


function invalidMethod(hook) {
  throw new feathersErrors.MethodNotAllowed("Sorry, but this is not implemented.");
}

function checkQueryParameters(query) {
  // make sure the query is correct or raise an error.
  var qExists = false;
  var errors = [];
  // iterate over objectfrom
  //    https://stackoverflow.com/a/588276/1320237
  for(var key in query) {
    if(query.hasOwnProperty(key)) {
      qExists = qExists || key == "Q";
      if (key != "Q") {
        errors.push("Parameter \"" + key + "\" is not supported.");
      }
    }
  }
  if (errors.length != 0) {
    throw new feathersErrors.BadRequest("Invalid parameters", errors);
  }
  if (!qExists) {
    throw new feathersErrors.BadRequest("The Q parameter MUST be given.");
  }
}

function createElastisearchParameters(hook) {
  checkQueryParameters(hook.params.query);
  hook.params.esQuery = {q: hook.params.query.Q};
}

function convertSearchObjectToResource(object, root) {
  return convert.convertResource(object._source, root);
}

function convertElastisearchResult(hook) {
  var search = hook.result;
  var root = convert.getResourceRoot(hook.params.req);
  var searchRoot = convert.getServerUrl(hook.params.req);
  var objects = search.hits.hits.map(
    object => convertSearchObjectToResource(object, root));
  var result = {
    jsonapi: jsonapi,
    links: {
      self: {
        href: searchRoot + "?" + qs.stringify(hook.params.query),
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
  hook.result = result;
}

module.exports = {
  before: {
    all: [checkContentNegotiation],
    find: [createElastisearchParameters],
    get: [invalidMethod],
    create: [invalidMethod],
    update: [invalidMethod],
    patch: [invalidMethod],
    remove: [invalidMethod]
  },

  after: {
    all: [],
    find: [convertElastisearchResult],
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
