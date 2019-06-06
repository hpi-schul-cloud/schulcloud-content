const authenticateHook = require('../../authentication/authenticationHook');
const errors = require('@feathersjs/errors');


const {
  hashPassword, protect
} = require('@feathersjs/authentication-local').hooks;

const checkUserHasRole = (permittedRoles) => async hook => {
  const userModel = hook.app.get('mongooseClient').model('users');
  return new Promise((resolve, reject) => {
    userModel.findById(hook.params.user._id, function (err, user) {
      if(err) { reject(new errors.GeneralError(err)); }
      if(!user) {
        reject(new errors.NotFound('User not found'));
      }
      if (!permittedRoles.includes(user.role)){
        reject(new errors.Forbidden('Permissions missing'));
      }
      hook.params.user.role = user.role;
      hook.params.user.providerId = user.providerId;
      return resolve(hook);
    });
  });
};

const restrictAccessToCurrentProvider = hook => {
  if(hook.params.user.role !== 'superhero') {
    hook.params.query = { providerId: hook.params.user.providerId };
  }
  return hook;
};

const restrictCreationToCurrentProvider = hook => {
  if(hook.params.user.role !== 'superhero') {
    hook.data.providerId = hook.params.user.providerId;
    hook.data.role = 'user';
  }
  return hook;
};

const ckeckUserHasPermission = hook => {
  return checkUserHasRole(['admin', 'superhero'])(hook)
  .then(()=>{
    if(hook.method == 'create') {
      restrictCreationToCurrentProvider(hook);
    } else {
      restrictAccessToCurrentProvider(hook);
    }
  });
};

const skipInternal = (method) => (hook) => {
  if (typeof hook.params.provider === 'undefined') {
    return hook;
  }
  return method(hook);
};

module.exports = {
  before: {
    all: [ authenticateHook(), skipInternal(ckeckUserHasPermission) ],
    find: [  ],
    get: [  ],
    create: [ hashPassword() ],
    patch: [  hashPassword() ],
    remove: [  ]
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
