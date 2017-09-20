/* This converts results from the database into a jsonapi compatible format.
 * 
 * If you have provided the data in jsonapi compatible format,
 * you can set the `data.isJsonapiCompatible` to `true`.
 */

function convertResource(resource, root) {
  var originalResource;
  if (resource.originalResource == undefined) {
    throw Error("jsonapi-content-type.js: resource can not be converted");
  } else {
    originalResource = JSON.parse(resource.originalResource);
  }
  var result = {
    'id': resource.originId,
    'type': 'resource',
    'attributes': originalResource,
    'links': {
      'self': root + "/" + resource.originId
    }
  };
  return result;
}

function convertResourceList(resourceList, root) {
  return resourceList.map(resource => { return {
      'id': resource.originId,
      'type': 'id',
    };});
}

function getResourceRoot(req) {
  // return the resource root from the request object
  return req.protocol + '://' + req.headers.host + '/v1/resources'
}

module.exports = function jsonapi(req, res) {
  console.log("jsonapi-content-type.js: jsonapi");
  var data;
  var endpoint;
  if (res.data.jsonapi != undefined) {
    console.log("Provided JSONAPI compatible data.")
    res.end(JSON.stringify(res.data, null, '  '));
    return;
  }
  var root = getResourceRoot(req);
  if (res.data == null) {
    // no content needs to be returned
    res.code = 204;
    res.end();
    return;
  }
  if (res.data.total != undefined) {
    // we have a listing here
    endpoint = "/ids";
    data = convertResourceList(res.data.data, root);
  } else if (res.data instanceof Array) {
    endpoint = "";
    data = convertResourceList(res.data, root);
  } else {
    // we have a single resource
    
//    console.log("src/jsonapi-content-type.js: convertResource", res.data);
    data = convertResource(res.data, root);
    endpoint = "/" + res.data.originId;
  }
  var location = root + endpoint;
  var result = {
    'data': data,
    'links': {
      'self': location,
    },
    'jsonapi' : require("./jsonapi-response"),
  };
  res.append("Location", location);
  res.end(JSON.stringify(result, null, '  '));
}

module.exports.convertResource = convertResource;
module.exports.getResourceRoot = getResourceRoot;
