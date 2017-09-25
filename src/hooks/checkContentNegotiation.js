const toJSONAPIError = require('./toJsonapiError');
const feathersErrors = require('feathers-errors');


// 415 - Unavailable
function UnsupportedMediaType(message, data) {
  feathersErrors.FeathersError.call(this, message, 'UnsupportedMediaType', 415, 'Unsupported Media Type', data);
}
UnsupportedMediaType.prototype = feathersErrors.FeathersError.prototype;

const targetContentType = "application/vnd.api+json";

function checkContentNegotiation(hook) {
  // parse the jsonapi compatibility from the headers.
  // hook.params.isJsonapi is set to true/false if 
  // http://jsonapi.org/format/#content-negotiation-servers
  console.log('checkContentNegotiation', hook.params.req.headers);
  var content_type = hook.params.req.headers['content-type'];
  hook.params.isJsonapi = false;
  if (content_type != undefined) {
    // http://jsonapi.org/format/#content-negotiation-servers
    // Servers MUST send all JSON API data in response documents with the header Content-Type: application/vnd.api+json without any media type parameters.
    if (content_type == targetContentType) {
      hook.params.isJsonapi = true;
    } else if (content_type.startsWith(targetContentType)) {
      hook.params.isJsonapi = true;
      throw new UnsupportedMediaType("Content-Type must be \"application/vnd.api+json\" without any parameters, not \"" + content_type + "\".")
    }
  }
  var accept = hook.params.req.headers['accept'];
  if (accept != undefined) {
    accept = accept.split(",");
    var expected_accept = [
      //"*/*", "application/*", // add this in to check also other content types
      targetContentType];
    var accepted = false;
    var should_accept = false;
    accept.forEach(a1 => expected_accept.forEach(a2 => {
      accepted = accepted || a1 == a2;
      should_accept = should_accept || a1.startsWith(targetContentType);
    }))
    console.log("checkContentNegotiation: accepted == " + accepted + "; should_accept == " + should_accept);
    if (should_accept != accepted) {
      hook.params.isJsonapi = true;
      throw new feathersErrors.NotAcceptable("Accept must include \"application/vnd.api+json\" without any parameters, \"" + accept + "\" does not do that.")
    }
    if (accepted) {
      hook.params.isJsonapi = true;
    }
  }
  console.log('checkContentNegotiation: hook.params.isJsonapi == ', hook.params.isJsonapi);
}

function ifJsonapi(hookFunction) {
  // if the hook is jsonapi compatible, execute the function passed to it.
  return function(hook) {
    if (hook.params.isJsonapi) {
      return hookFunction(hook)
    }
  }
}

module.exports = checkContentNegotiation;
module.exports.UnsupportedMediaType = UnsupportedMediaType;
module.exports.ifJsonapi = ifJsonapi;
