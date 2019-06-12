const commonHooks = require('feathers-hooks-common');
const defaultHooks = require('./file_default.hook.js');
const authenticateHook = require('../../authentication/authenticationHook');
const { unifySlashes } = require('../../hooks/unifySlashes');


const errors = require('@feathersjs/errors');

const hasViewPermission = hook => {
  // TODO implement permission check for non public content

  /*
    1. get resourceId for filepath
    2. check if resource is Published
      2.1 if isPublished => allow access
      2.2 else check if access token exists
        2.2.1 if access_token exists => allow access
  */

  // skip for internal calls
  if (typeof hook.params.provider === 'undefined') {
    return hook;
  }

  const app = hook.app;
  let [resourceId, ...filePath] = hook.params.route[0]
    .replace(/^\/+/g, '')
    .split('/');
  filePath = '/' + filePath.join('/');

  return app
    .service('resource_filepaths')
    .find({
      query: {
        resourceId,
        path: filePath,
        isTemp: false
      }
    })
    .then(resources => {
      const resourceId = (resources.data[0] || {}).resourceId;
      if (!resourceId) {
        throw new errors.NotFound('No Resource for File Found');
      }
      return app.service('resources').get(resourceId);
    })
    .then(resource => {
      if (resource.isPublished) {
        return hook;
      }
      //return hook.app.service('access_token').get(hook.params.query.access_token) // read token from cookie / set cookie from query
      return app.service('access_token').find({
        query: {
          resourceId: resource._id
        }
      });
    })
    .then(response => {
      if (response.total === 0) {
        throw new errors.Forbidden('Permissions missing');
      }
      return hook;
    });
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

const restrictResourceToCurrentProvider = async hook => {
  if(hook.params.user.role !== 'superhero') {
    const resource = await hook.app.service('resources').get(hook.id);
    if(!(resource.providerId == hook.params.user.providerId.toString())) {
      throw new errors.Forbidden('Permissions missing');
    }
  }
  return hook;
};

const restrictToProviderOrToPublicResources = hook => {
  if(hook.params.user.role !== 'superhero') {
    if(!(hook.params.resource.providerId.toString() === hook.params.user.providerId.toString() || hook.params.resource.isPublished === true)) {
      throw new errors.Forbidden('Permissions missing');
    }
  }
  return hook;
};

const restrictToPublicResources = hook => {
  if(hook.params.resource.isPublished != true) {
    throw new errors.Forbidden('Permissions missing');
  }
  return hook;
};

const getResource = async hook => {
  const path = hook.params.route[0];
  let [resourceId] = unifySlashes(path)
    .replace(/^\/+/g, '') // remove leading slashes
    .split('/');
  const resource = await hook.app.service('resources').get(resourceId);
  hook.params.resource = resource;
  return hook;
};

// Lern-Store can only access public resources, authenticated users can access public resources and resources of their company
const checkPermissionsAfterAuthentication = hook => {
  return getResource(hook)
  .then((resultHook)=>{
    return authenticateHook()(resultHook)
    .then(result => {
      return getCurrentUserData(result).then((res)=>{
          return restrictToProviderOrToPublicResources(res);
      });
    })
    .catch(()=>{
      return restrictToPublicResources(hook);
    });
  });
};

const skipInternal = (method) => (hook) => {
if (typeof hook.params.provider === 'undefined') {
  return hook;
}
return method(hook);
};

const distributionHooks = {
  ...defaultHooks,
  before: {
    find: [
      skipInternal(checkPermissionsAfterAuthentication)
    ]
  }
};

const manageHooks = {
  ...defaultHooks,
  before: {
    all: [commonHooks.disallow('external')]
  }
};

const structureHooks = {
  ...defaultHooks,
  before: {
    get: [
      skipInternal(authenticateHook()),
      skipInternal(getCurrentUserData),
      skipInternal(restrictResourceToCurrentProvider)
    ]
  }
};

const uploadHooks = {
  ...defaultHooks,
  before: {
    create: [
      authenticateHook()
    ]
  }
};

const thumbnailHooks = {
  ...defaultHooks,
  before: {
    all: [commonHooks.disallow('external')]
  }
};

module.exports = {
  distribution: distributionHooks,
  manage: manageHooks,
  structure: structureHooks,
  upload: uploadHooks,
  thumbnail: thumbnailHooks
};
