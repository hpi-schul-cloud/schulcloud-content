const { populateResourceUrls } = require('../../hooks/populateResourceUrls');
const errors = require('@feathersjs/errors');
const authenticateHook = require('../../authentication/authenticationHook');


const allowDisableLimit = hook => {
  if (hook.params.query.$limit === '-1') {
    hook.params.paginate = false;
    hook.params.query.$limit = 10000; // just deleting $limit causes the default value :(
  }
  return hook;
};

const restrictToProviderOrToPublicResources = hook => {
  async function getUser(userId) {
    const userModel = hook.app.get('mongooseClient').model('users');
    return new Promise((resolve, reject) => {
      userModel.findById(userId, function (err, user) {
        if(err) { reject(new errors.GeneralError(err)); }
        if(!user) {
          reject(new errors.NotFound('User not found'));
        }
        return resolve(user);
      });
    });
  }

  return getUser(hook.params.user._id)
  .then((user)=>{
    if(user.role !== 'superhero') {
      hook.params.query = {$or: [
        { providerId: user.providerId.toString() },
        { isPublished: true }
      ]};
    }
    return hook;
  });
};

const restrictToPublicResources = hook => {
  hook.params.query = { isPublished: true };
  return hook;
};

// Lern-Store can only access public resources, authenticated users can access public resources and resources of their company
const checkPermissionsAfterAuthentication = hook => {
  try {
    return authenticateHook()(hook).then(result => {
      return restrictToProviderOrToPublicResources(result);
    });
  } catch (error) {
    return restrictToPublicResources(hook);
  }
};

module.exports = {
  before: {
    all: [],
    find: [checkPermissionsAfterAuthentication, allowDisableLimit],
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
