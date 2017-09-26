const validateResourceSchema = require('../../hooks/validate-resource-schema-v1/');
const authenticate = require('../../hooks/authenticate');
const uuidV4 = require('uuid/v4');
const feathersErrors = require('feathers-errors');
const crypto = require('crypto');
const authenticationHooks = require('feathers-authentication-hooks');
const toJSONAPIError = require('../../hooks/toJsonapiError');
const checkContentNegotiation = require('../../hooks/checkContentNegotiation');

function originIdToObjectIdString(originId, hook) {
  if (hook.params.user == undefined || hook.params.user == undefined) {
    throw new feathersErrors.NotAuthenticated('Authentication is required for setOriginIdToObjectId');
  } 
  var userId = hook.params.user.id;
  var baseId = originId.toString() + ":" + userId.toString(); 
  var string = crypto.createHash('sha256').update(baseId).digest('hex').substring(0, 24);
  return string
}

function setOriginIdToObjectId(hook) {
  if (hook.id != null) {
    hook.id = originIdToObjectIdString(hook.id, hook);
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
      throw new feathersErrors.Forbidden("The id of a resource must not be \"ids\".");
    }
    result.originId = source.data.id;
  } else {
    result.originId = uuidV4();
  }
  result._id = originIdToObjectIdString(result.originId, hook);
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
}

function noResponseContent(hook) {
  // These endpoints do not need to return any data
  hook.result = null;
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
      return; // invalid schema, 422 should pass
    }
    const id = data.id;
    const idRegex = RegExp("^([!*\"'(),+a-zA-Z0-9$_@.&+\\-])+$");
    if (id != undefined && (typeof id != "string" || idRegex.exec(id) == null)) {
      hook.error.code = 403;
      hook.error.message = "Invalid id at data.id: " + JSON.stringify(id) + 
                           " - " + hook.error.message;
      toJSONAPIError(hook);
    }
  }
}



// from https://stackoverflow.com/q/44091808/1320237
// those hooks require authentication before
const readRestrict = authenticationHooks.queryWithCurrentUser({
  idField: 'id',
  as: 'userId'
});
const modRestrictRemove = authenticationHooks.restrictToOwner({
  idField: 'id',
  as: 'userId'
});
const modRestrictCreate = authenticationHooks.associateCurrentUser({
  idField: 'id',
  as: 'userId'
});

// if (hook.data.userId != hook.params.user.id) {
//   throw new feathersErrors.NotFound("The resource does not belong to you!")
// }

function setUserIdField(hook) {
  // set the user field for readRestrict and modRestrict
  if (hook.params.user == undefined || hook.params.user.id == undefined) {
    throw new feathersErrors.NotAuthenticated('Authentication is required for setUserField');
  }
  hook.data.userId = hook.params.user.id;
}

function invalidMethod(hook) {
  throw new feathersErrors.MethodNotAllowed("Sorry, but this is not implemented.");
}

// https://docs.feathersjs.com/api/hooks.html#application-hooks
module.exports = {
  before: {
    all: [
      checkContentNegotiation],
    find: [authenticate, readRestrict],
    get: [authenticate, readRestrict, setOriginIdToObjectId],
    create: [
      validateResourceSchema(),
      authenticate,
      modRestrictCreate, 
      setUserIdField,
      prepareResourceForDatabase,
    ],
    update: [invalidMethod],
    patch: [invalidMethod],
    remove: [authenticate, setOriginIdToObjectId, modRestrictCreate]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [noResponseContent]
  },

  error: {
    all: [toJSONAPIError],
    find: [],
    get: [],
    create: [resourceIdErrorsAre403],
    update: [],
    patch: [],
    remove: []
  }
};
