function convertResource(resource, root) {
  var originalResource = JSON.parse(resource.originalResource);
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

module.exports = function jsonapi(req, res) {
  console.log("resource-v1.service.js: jsonapi");
  var data;
  var endpoint;
  var root = 'http://' + req.headers.host + '/v1/resources';
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
    
    console.log("resource-v1.service.js: convertResource", res.data);
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
