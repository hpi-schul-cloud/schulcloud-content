const authenticateHook = require('../../authentication/authenticationHook');


const {
  hashPassword, protect
} = require('@feathersjs/authentication-local').hooks;

const checkRole = ({permittedRoles}) => async hook => {
  // skip for internal calls
  if (typeof hook.params.provider === 'undefined') {
    return hook;
  }
  const userModel = hook.app.get('mongooseClient').model('users');
  return new Promise((resolve, reject) => {
    userModel.findById(hook.params.user._id, function (err, user) {
      if (err || !user) { return reject(err); }
      if (permittedRoles.includes(user.role)){
          hook.params.user.role = user.role;
          hook.params.user.providerId = user.providerId;
          return resolve();
      } else {
        return reject('not permitted');
      }
    });
  });
};

const restrictAccessByProvider = hook => {
  // skip for internal calls
  if (typeof hook.params.provider === 'undefined') {
    return hook;
  }
  if(hook.params.user.role !== 'superhero') {
    hook.params.query = { providerId: hook.params.user.providerId };
  }
  return hook;
};

const restrictCreationByProvider = hook => {
  if(hook.params.user.role !== 'superhero') {
    hook.data.providerId = hook.params.user.providerId;
  }
  return hook;
};

module.exports = {
  before: {
    all: [ authenticateHook(), checkRole({ permittedRoles: ['admin', 'superhero'] }) ],
    find: [ restrictAccessByProvider ],
    get: [ restrictAccessByProvider ],
    create: [ restrictCreationByProvider, hashPassword() ],
    patch: [ restrictAccessByProvider, hashPassword() ],
    remove: [ restrictAccessByProvider ]
  },

  after: {
    all: [
      // Make sure the password field is never sent to the client
      // Always must be the last hook
      protect('password')
    ],
    find: [],
    get: [],
    create: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    patch: [],
    remove: []
  }
};
