module.exports = function jsonapi(req, res) {
  console.log("resource-v1.service.js: jsonapi", JSON.stringify(res.data))
  var originalResource = JSON.parse(res.data.originalResource); // TODO: if absent, convert attributes back
  var location = 'http://' + req.headers.host + '/v1/resources/' + res.data._id;
  var result = {
    'data': {
      'id': res.data._id,
      'type': 'resource',
      'attributes': originalResource,
    },
    'links': {
      'self': location,
    },
    'jsonapi' : require("./jsonapi-response"),
  };
  res.append("Location", location);
  res.end(JSON.stringify(result));
}