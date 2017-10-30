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

function getServerUrl(req) {
  // return the resource root from the request object
  return req.protocol + '://' + req.headers.host
}

function getResourceRoot(req) {
  // return the resource root from the request object
  return getServerUrl(req) + '/v1/resources'
}

module.exports = function jsonapi(req, res) {
  if (res.data == null) {
    // no content needs to be returned
    res.code = 204;
    res.end();
    return;
  }
  if (res.data !== undefined && res.data.links !== undefined && res.data.links.self !== undefined) {
    var self = res.data.links.self;
    if (typeof self == "string") {
      res.append("Location", self);
    } else {
      res.append("Location", self.href);
    }
  }
  res.json(res.data);
}

module.exports.convertResource = convertResource;
module.exports.getServerUrl = getServerUrl;
module.exports.getResourceRoot = getResourceRoot;
