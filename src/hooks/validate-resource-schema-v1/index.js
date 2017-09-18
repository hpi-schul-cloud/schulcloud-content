const commonHooks = require('feathers-hooks-common');
const api = require("@schul-cloud/schul-cloud-resources-api-v1");
const feathersErrors = require('feathers-errors');

// 422 Unprocessable Entity
function UnprocessableEntity(message, data) {
  feathersErrors.FeathersError.call(this, message, 'UnprocessableEntity', 422, 'Unprocessable Entity', data);
}
UnprocessableEntity.prototype = feathersErrors.FeathersError.prototype;


/*
 * Add hook
 */
module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  var schema = api.schemas.resource_post.getSchema();
  var validateSchema = commonHooks.validateSchema(schema, api.ajv);
  return function(hook) {
    try{
      validateSchema(hook);
    } catch(e) {
      if (e.code == 400) {
        // convert Bad Request to Unprocessable Entity
        // https://httpstatuses.com/422
        throw new UnprocessableEntity(e.message, e.data);
      }
    }
  }
};