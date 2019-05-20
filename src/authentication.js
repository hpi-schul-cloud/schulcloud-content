const authentication = require('@feathersjs/authentication');
const jwt = require('@feathersjs/authentication-jwt');
const local = require('@feathersjs/authentication-local');
const basicAuth = require('basic-auth');
const errors = require('@feathersjs/errors');

module.exports = function (app) {
  const config = app.get('authentication');

  // Set up authentication with the secret
  app.configure(authentication(config));
  app.configure(jwt());
  app.configure(local());

  function checkLocalAuthentication(username, password) {
    const config = require('config');
    const localUsers = config.get('localAuthentication');
    return localUsers.find(user => { return user.username === username && user.password === password; });
  }

  const authenticateHook = async hook => {
    // skip for internal calls
    if(typeof (hook.params.provider) === 'undefined'){
      return hook;
    }

    let authHeader = (((hook.params||{}).req||{}).headers||{})['authorization'];

     // BASIC AUTH
    if ((authHeader || '').startsWith('Basic')) {

      if(!hook.params){ hook.params = {}; }
      // prevent userId injection
      if(hook.params.userId){
        delete hook.params.userId;
      }

      let credentials = basicAuth.parse(authHeader);
      if (!credentials) { throw new errors.NotAuthenticated('Could not authenticate! Missing username and/or password'); }

      // Check Local config auth
      let localUser = checkLocalAuthentication(credentials.name, credentials.pass);
      if(localUser) {
        // check hook.data is available
        hook.params.userId = localUser.userId;
        return hook;
      }
    }
    // FEATHERS JWT AUTH
    else {
      hook = await authentication.hooks.authenticate(config.strategies)(hook);
      return hook;
    }
    // Otherwise
    throw new errors.NotAuthenticated('Could not authenticate. We are currently supporting Basic- and Bearer Token Auth.');
  };

  // The `authentication` service is used to create a JWT.
  // The before `create` hook registers strategies that can be used
  // to create a new valid JWT (e.g. local or oauth2)
  app.service('authentication').hooks({
    before: {
      create: [
        authenticateHook
      ],
      remove: [
        authentication.hooks.authenticate('jwt')
      ]
    }
  });
};
