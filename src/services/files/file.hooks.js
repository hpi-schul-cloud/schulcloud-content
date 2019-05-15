//const authenticate = require('../../hooks/authenticate');
const commonHooks = require('feathers-hooks-common');
const defaultHooks = require('./file_default.hook.js');
const authenticate = require('../../hooks/authenticate');
const errors = require('@feathersjs/errors');

const forceHookResolve = forcedHook => {
  return hook => {
    try {
      return forcedHook(hook).then(result => {
        return Promise.resolve(result);
      });
    } catch (error) {
      return Promise.resolve(hook);
    }
  };
};

const hasViewPermission = hook => {
  // TODO implement permission check for non public content

  /*
    1. get resourceId for filepath
    2. check if resource is Published
      2.1 if isPublished => allow access
      2.2 else check if access token exists
        2.2.1 if access_token exists => allow access
  */
  const app = hook.app;
  let [resourceId, ...filePath] = hook.params.route[0]
    .replace(/^\//, '')
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

const distributionHooks = {
  ...defaultHooks,
  before: {
    get: [hasViewPermission],
    find: [hasViewPermission]
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
    get: [forceHookResolve(authenticate)]
  }
};

const uploadHooks = {
  ...defaultHooks,
  before: {
    create: [authenticate]
  }
};

const thumbnailHooks = {
  ...defaultHooks
};

module.exports = {
  distribution: distributionHooks,
  manage: manageHooks,
  structure: structureHooks,
  upload: uploadHooks,
  thumbnail: thumbnailHooks,
};
