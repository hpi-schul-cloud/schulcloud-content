const handler = require('feathers-errors/handler');
const notFound = require('feathers-errors/not-found');
const feathersErrors = require('feathers-errors');

module.exports = function () {
  // Add your custom middleware here. Remember, that
  // in Express the order matters, `notFound` and
  // the error handler have to go last.
  const app = this;

  app.use(notFound());
  errorHandler = handler({
    "json": function(error, req, res, next) {
      var output = error.toJSON() || {};
      // all errors are jsonapi error compatible
      res.set('Content-Type', 'application/vnd.api+json');
      res.end(JSON.stringify(output, null, '  '));
    }
  });
  function specialErrorHandling(error, req, res, next) {
    // passing nad json is a bad request!
    // {"body":"invalid json","status":400,"statusCode":400};
    if (error.body != undefined && error.status == 400 && error.statusCode == 400) {
      return errorHandler(new feathersErrors.BadRequest("Invalid JSON", error.body),
                          req, res, next);
    }
    return errorHandler(error, req, res, next);
  };
  app.use(specialErrorHandling);
};
