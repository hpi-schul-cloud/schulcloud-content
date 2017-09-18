const validateResourceSchema = require('../../hooks/validate-resource-schema-v1/');
const authenticate = require('../../hooks/authenticate');
const uuidV4 = require('uuid/v4');

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
    result.originId = source.data.id;
  } else {
    result.originId = uuidV4();
  }
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
  console.log(result);
}

function afterFind(hook) {
  console.log("afterFind:", hook.data)
}

// https://docs.feathersjs.com/api/hooks.html#application-hooks
module.exports = {
  before: {
    all: [function(hook){console.log('before all hook ran');}],
    find: [function(hook){console.log('find 1');}],
    get: [],
    create: [
      function(hook){console.log('create 1');},
      validateResourceSchema(),
      authenticate,
      prepareResourceForDatabase,
      function(hook){console.log('create 2');}
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [afterFind],
    get: [],
    create: [function(hook){console.log('create after', hook.data);}],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [function(hook){console.log('create error', hook.error);}],
    update: [],
    patch: [],
    remove: []
  }
};
