const commonHooks = require('feathers-hooks-common');
const api = require("@schul-cloud/schul-cloud-resources-api-v1");

/*
 * Add hook
 */
module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  var schema = api.schemas.resource.getSchema();
  return commonHooks.validateSchema(schema, api.ajv);
};
