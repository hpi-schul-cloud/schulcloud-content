const { populateResourceUrls } = require('../../hooks/populateResourceUrls');
const authenticateHook = require('../../authentication/authenticationHook');
const {
  skipInternal,
  getCurrentUserData
} = require('../../authentication/permissionHelper.hooks.js');

const allowDisableLimit = hook => {
  if (hook.params.query.$limit === '-1') {
    hook.params.paginate = false;
    hook.params.query.$limit = 10000; // just deleting $limit causes the default value :(
  }
  return hook;
};

const restrictToProviderOrToPublicResources = hook => {
  if (hook.params.user.role !== 'superhero') {
    if (!hook.params.query.$or) {
      hook.params.query.$or = [];
    }
    hook.params.query.$or.push(
      ...[
        { providerId: hook.params.user.providerId.toString() },
        { isPublished: true }
      ]
    );
  }
  return hook;
};

const restrictToPublicResources = hook => {
  hook.params.query.isPublished = true;
  return hook;
};

// Lern-Store can only access public resources, authenticated users can access public resources and resources of their company
const checkPermissionsAfterAuthentication = hook => {
  return authenticateHook()(hook)
    .then(result => {
      return getCurrentUserData(result).then(res => {
        return restrictToProviderOrToPublicResources(res);
      });
    })
    .catch(() => {
      return restrictToPublicResources(hook);
    });
};

module.exports = {
  before: {
    all: [],
    find: [
      skipInternal(checkPermissionsAfterAuthentication),
      allowDisableLimit
    ],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [populateResourceUrls],
    get: [populateResourceUrls],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
