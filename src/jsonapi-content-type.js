/* This converts results from the database into a jsonapi compatible format.
 * 
 * If you have provided the data in jsonapi compatible format,
 * you can set the `data.isJsonapiCompatible` to `true`.
 */

function convertResource(resource, root) {
  var originalResource;
  if (resource.originalResource == undefined) {
    originalResource = {
      languages: ["de-de"]
    };
    ["url", "title", "thumbnail", "tags", "mimeType", "originId",
     "providerName", "description"].forEach(
      function(name) {
        if (resource[name] != undefined) {
          originalResource[name] = resource[name];
        }
    });
    contentCategoryMapping = {
      "atomic" : "a",
      "learning-object" : "l",
      "proven-learning-object" : "rl",
      "tool" : "t"
    };
    originalResource.contentCategory = contentCategoryMapping[resource.contentCategory];
    originalResource.licenses = resource.licenses.map(function(license) {
      return {"value": license, "copyrighted" : true};
    })
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

function getServerUrl(req) {
  // return the resource root from the request object
  return req.protocol + '://' + req.headers.host
}


function getResourceRoot(req) {
  // return the resource root from the request object
  return getServerUrl(req) + '/v1/resources'
}

module.exports = function jsonapi(req, res) {
  console.log("jsonapi-content-type.js: jsonapi");
  var data;
  var endpoint;
  if (res.data == null) {
    // no content needs to be returned
    res.code = 204;
    res.end();
    return;
  }
  if (res.data.jsonapi != undefined) {
    console.log("Provided JSONAPI compatible data.")
    res.json(res.data);
    return;
  }
  var root = getResourceRoot(req);
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
  res.json(result);
}

module.exports.convertResource = convertResource;
module.exports.getResourceRoot = getResourceRoot;
module.exports.getServerUrl = getServerUrl;
