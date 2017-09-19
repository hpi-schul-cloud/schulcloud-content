const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const feathers = require('feathers');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');


const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

const mongodb = require('./mongodb');
const convertToJsonapi = require('./jsonapi-content-type.js');

const app = feathers();

// Load app configuration
app.configure(configuration(path.join(__dirname, '..')));
// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', feathers.static(app.get('public')));


// Set up Plugins and providers
app.configure(hooks());
app.configure(mongodb);

  app.configure(rest(function(req, res) {
    // https://docs.feathersjs.com/api/rest.html
    function json() {
      res.end(JSON.stringify(res.data));
    }
    res.format({
    'application/vnd.api+json': function(){convertToJsonapi(req, res)},
    'application/json': json,
    'default': json,
    });  
  }));


// Allow accessing req-object in hooks
app.use(function(req, res, next) {
  req.feathers.req = req;
  next();
});

// Set up our services (see `services/index.js`)
app.configure(services);
// Configure middleware (see `middleware/index.js`) - always has to be last
app.configure(middleware);
app.hooks(appHooks);

module.exports = app;
