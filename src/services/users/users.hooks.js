const authenticateHook = require('../../authentication/authenticationHook');
const {
  skipInternal,
  getCurrentUserData
} = require('../../authentication/permissionHelper.hooks.js');
const errors = require('@feathersjs/errors');

const {
  hashPassword,
  protect
} = require('@feathersjs/authentication-local').hooks;

const checkUserHasRole = permittedRoles => hook => {
  if (!permittedRoles.includes(hook.params.user.role)) {
    throw new errors.Forbidden('Permissions missing');
  }
  return hook;
};

const restrictAccessToCurrentProvider = async hook => {
  // Admin can only access users of his own company
  if (hook.params.user.role === 'admin') {
    hook.params.query.providerId = hook.params.user.providerId;
  }
  // User can only access himself
  else if (
    hook.params.user.role === 'user' &&
    hook.id != hook.params.user._id
  ) {
    throw new errors.Forbidden(
      'Permissions missing. You can only request your own userId'
    );
  }
  return hook;
};

const restrictCreationToCurrentProvider = hook => {
  if (hook.params.user.role !== 'superhero') {
    hook.data.providerId = hook.params.user.providerId;
    hook.data.role = 'user';
  }
  return hook;
};

module.exports = {
  before: {
    all: [authenticateHook(), skipInternal(getCurrentUserData)],
    find: [
      skipInternal(checkUserHasRole(['superhero', 'admin'])),
      skipInternal(restrictAccessToCurrentProvider)
    ],
    get: [skipInternal(restrictAccessToCurrentProvider)],
    create: [
      skipInternal(checkUserHasRole(['superhero', 'admin'])),
      skipInternal(restrictCreationToCurrentProvider),
      hashPassword()
    ],
    patch: [skipInternal(restrictAccessToCurrentProvider), hashPassword()],
    remove: [
      skipInternal(checkUserHasRole(['superhero', 'admin'])),
      skipInternal(restrictAccessToCurrentProvider)
    ]
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
