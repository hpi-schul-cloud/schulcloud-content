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

const getCurrentUserData = hook => {
  const userModel = hook.app.get('mongooseClient').model('users');
    return new Promise((resolve, reject) => {
      userModel.findById(hook.params.user._id, function (err, user) {
        if(err) { reject(new errors.GeneralError(err)); }
        if(!user) {
          reject(new errors.NotFound('User not found'));
        }
        hook.params.user.role = user.role;
        hook.params.user.providerId = user.providerId;
        return resolve(hook);
      });
    });
};

const restrictToProviderOrToPublicResources = hook => {
    if(hook.params.user.role !== 'superhero') {
      if (hook.params.query.$or) {
        hook.params.query.$or.push(...[
          { providerId: hook.params.user.providerId.toString() },
          { isPublished: true }
        ]);
      } else {
        hook.params.query.$or = [
          { providerId: hook.params.user.providerId.toString() },
          { isPublished: true }
        ];
      }
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
    return getCurrentUserData(result).then((res)=>{
      return restrictToProviderOrToPublicResources(res);
    });
  })
  .catch(()=>{
    return restrictToPublicResources(hook);
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
    all: [],
    find: [skipInternal(checkPermissionsAfterAuthentication), allowDisableLimit],
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
