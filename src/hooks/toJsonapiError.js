const jsonapi = require('../jsonapi-response');
const errors = require('./errors');

function toJSONAPIError(hook) {
  var error = hook.error;
  var code = error.code || 500;
  var result = {
    'jsonapi': jsonapi,
    'errors': [
      {
        "status": "" + code,
        "title": errors["" + code],
        "detail": error.message,
        "meta": {
          "traceback": error.stack,
          "data": error.data
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
    stack: error.stack,
    data: error.data,
  }
}

module.exports = toJSONAPIError;