const validateResourceSchema = require('../../hooks/validate-resource-schema-v1/');
const authenticate = require('../../hooks/authenticate');
const uuidV4 = require('uuid/v4');
const errors = require('./errors.json');
const feathersErrors = require('feathers-errors');
const crypto = require('crypto');

function originIdToObjectIdString(originId) {
  var string = crypto.createHash('sha256').update(originId).digest('hex').substring(0, 24);
  console.log("originIdToObjectId: ", string);
  return string
}

function setOriginIdToObjectId(hook) {
  if (hook.id != null) {
    console.log("setOriginIdToObjectId: ", hook.id);
    hook.id = originIdToObjectIdString(hook.id, hook.app);
    console.log("setOriginIdToObjectId: new id ", hook.id);
  }
}

function prepareResourceForDatabase(hook) {
  /* Incoming resource has these fields:
   * - data, see the resource-post schema https://github.com/schul-cloud/resources-api-v1/tree/master/schemas/resource-post
   * - userId from the authentication hook
   *
   * Outgoing resource should have to followig properties
   * - userId
   * - anything else, see ../../models/resource.model.js
   */
  const source = hook.data;
  const attributes = source.data.attributes;
  var result = hook.data = {};
  // convert result
  result.userId = source.userId;
  if (source.data.id) {
    if (source.data.id == "ids") {
      throw new feathersErrors.Forbidden("The idof a resource must not be \"ids\".");
    }
    result.originId = source.data.id;
  } else {
    result.originId = uuidV4();
  }
  result._id = originIdToObjectIdString(result.originId, hook.app);
  if (attributes.providerName) {
    result.providerName = "" + attributes.providerName;
  } else {
    result.providerName = "none"; // TODO add user name
  }
  result.description = attributes.description || "none";
  // attributes to copy
  ["url", "title", "thumbnail", "tags", "mimeType"].forEach(
    function(name) {
      if (attributes[name] != undefined) {
        result[name] = attributes[name];
      }
    });
  if (attributes.licenses.length == 0) {
    result.licenses = ["unknown"];
  } else {
    result.licenses = attributes.licenses.map(license => license.value);
  }
  contentCategoryMapping = {
    "a" : "atomic",
    "l" : "learning-object",
    "rl": "proven-learning-object",
    "t" : "tool"
  };
  result.contentCategory = contentCategoryMapping[attributes.contentCategory];
  result.originalResource = JSON.stringify(attributes);
  console.log("prepareResourceForDatabase", result);
}

function afterFind(hook) {
  console.log("afterFind:", hook.data)
}

function toJSONAPIError(hook) {
  var error = hook.error;
  var code = error.code || 500;
  var result = {
    'jsonapi': require('../../jsonapi-response'),
    'errors': [
      {
        "status": "" + code,
        "title": errors["" + code],
        "detail": error.message, // todo include traceback and more errors
        "meta": {
          "traceback": error.stack,
        }
      }
    ]
  };
  // hack, see feathers-errors/lib/error-handler.js
  // this result must contain all the attributes we use from the error variable
  // to pass this own error back to ourselves
  hook.error = {
    toJSON: function() { return result; },
    type: 'FeathersError',
    result: result,
    code: error.code,
    message: error.message,
    stack: error.stack
  }
  console.log("Error result:", result);
}

// 415 - Unavailable
function UnsupportedMediaType(message, data) {
  feathersErrors.FeathersError.call(this, message, 'UnsupportedMediaType', 415, 'Unsupported Media Type', data);
}
UnsupportedMediaType.prototype = feathersErrors.FeathersError.prototype;

function noResponseContent(hook) {
  // These endpoints do not need to return any data
  hook.result = null;
}

function checkContentNegotiation(hook) {
  // http://jsonapi.org/format/#content-negotiation-servers
  console.log('checkContentNegotiation', hook.params.req.headers);
  var content_type = hook.params.req.headers['content-type'];
  var targetContentType = "application/vnd.api+json";
  if (content_type != undefined) {
    // http://jsonapi.org/format/#content-negotiation-servers
    // Servers MUST send all JSON API data in response documents with the header Content-Type: application/vnd.api+json without any media type parameters.
    if (content_type != targetContentType && content_type.startsWith(targetContentType)) {
      throw new UnsupportedMediaType("Content-Type must be \"application/vnd.api+json\" without any parameters, not \"" + content_type + "\".")
    }
  }
  var accept = hook.params.req.headers['accept'];
  if (accept != undefined) {
    accept = accept.split(",");
    var expected_accept = ["*/*", "application/*", targetContentType];
    var accepted = false;
    var should_accept = false;
    accept.forEach(a1 => expected_accept.forEach(a2 => {
      accepted = accepted || a1 == a2;
      should_accept = should_accept || a2.startsWith(targetContentType);
    }))
    if (should_accept != accepted) {
      throw new feathersErrors.NotAcceptable("Accept must include \"application/vnd.api+json\" without any parameters, \"" + accept + "\" does not do that.")
    }
  }
}

function resourceIdErrorsAre403(hook) {
  // http://jsonapi.org/format/#crud-creating-client-ids
  if (hook.error.code == 409) {
    // we assume this is the id conflict
    hook.error.code = 403;
    toJSONAPIError(hook);
  } else if (hook.error.code == 422) {
    // check the id according to 
    //    https://github.com/schul-cloud/resources-api-v1/blob/master/schemas/resource-post/resource-post.json
    const data = hook.data.data;
    if (data == undefined) {
      return; // invalid schema
    }
    const id = data.id;
    const idRegex = RegExp("^([!*\"'(),+a-zA-Z0-9$_@.&+\\-])+$");
    console.log("resourceIdErrorsAre403: id == ", id);
    if (id != undefined && (typeof id != "string" || idRegex.exec(id) == null)) {
      hook.error.code = 403;
      hook.error.message = "Invalid id at data.id: " + JSON.stringify(id) + 
                           " - " + hook.error.message;
      toJSONAPIError(hook);
    }
  }
}

// https://docs.feathersjs.com/api/hooks.html#application-hooks
module.exports = {
  before: {
    all: [checkContentNegotiation],
    find: [function(hook){console.log('find 1');}],
    get: [function(hook){console.log('get 1');}, setOriginIdToObjectId],
    create: [
      function(hook){console.log('create 1');},
      validateResourceSchema(),
      authenticate,
      prepareResourceForDatabase,
      function(hook){console.log('create 2');}
    ],
    update: [],
    patch: [],
    remove: [function(hook){console.log('remove 1');}, setOriginIdToObjectId]
  },

  after: {
    all: [],
    find: [afterFind],
    get: [],
    create: [function(hook){console.log('create after', hook.data);}],
    update: [],
    patch: [],
    remove: [noResponseContent]
  },

  error: {
    all: [toJSONAPIError],
    find: [],
    get: [function(hook){console.log('get error', hook.error);}],
    create: [resourceIdErrorsAre403],
    update: [],
    patch: [],
    remove: [function(hook){console.log('remove error', hook.error);}]
  }
};
