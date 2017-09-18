function convertResource(resource, root) {
  var originalResource = JSON.parse(resource.originalResource);
  var result = {
    'id': resource._id,
    'type': 'resource',
    'attributes': originalResource,
    'links': {
      'self': root + resource._id
    }
  };
  return result;
}

function convertResourceList(resourceList, root) {
  return resourceList.map(resource => { return {
      'id': resource._id,
      'type': 'id',
    };});
}


module.exports = function jsonapi(req, res) {
  console.log("resource-v1.service.js: jsonapi", JSON.stringify(res.data))
  var data;
  var endpoint;
  var root = 'http://' + req.headers.host + '/v1/resources/';
  if (res.data.total) {
    // we have a listing here
    endpoint = "ids";
    data = convertResourceList(res.data.data, root);
  } else {
    // we have a single resource
    data = convertResource(res.data, root);
    endpoint = res.data._id;
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