const handler = require('feathers-errors/handler');
const notFound = require('feathers-errors/not-found');

module.exports = function () {
  // Add your custom middleware here. Remember, that
  // in Express the order matters, `notFound` and
  // the error handler have to go last.
  const app = this;

  app.use(notFound());
  app.use(handler({
    "json": function(error, req, res, next) {
      var output = error.toJSON() || {};
      // all errors are jsonapi error compatible
      res.set('Content-Type', 'application/vnd.api+json');
      res.end(JSON.stringify(output, null, '  '));
    }
  }));
};
