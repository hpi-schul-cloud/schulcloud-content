const commonHooks = require('feathers-hooks-common');
const defaultHooks = require('./file_default.hook.js');
const thumbnailHook = require('./thumbnail.hooks');
const authenticateHook = require('../../authentication/authenticationHook');
const {
  skipInternal,
  getCurrentUserData
} = require('../../authentication/permissionHelper.hooks.js');

const errors = require('@feathersjs/errors');

const restrictResourceToCurrentProvider = async hook => {
  if (hook.params.user.role !== 'superhero') {
    const resource = await hook.app.service('resources').get(hook.id);
    if (!(resource.providerId == hook.params.user.providerId.toString())) {
      throw new errors.Forbidden('Permissions missing');
    }
  }
  return hook;
};

const restrictToProviderOrToPublicResources = hook => {
  if (hook.params.user.role !== 'superhero') {
    if (
      !(
        hook.params.resource.providerId.toString() ===
          hook.params.user.providerId.toString() ||
        hook.params.resource.isPublished === true
      )
    ) {
      throw new errors.Forbidden('Permissions missing');
    }
  }
  return hook;
};

const restrictToPublicResources = hook => {
  if (hook.params.resource.isPublished != true) {
    throw new errors.Forbidden('Permissions missing');
  }
  return hook;
};

const getResource = async hook => {
  const resourceId = hook.params.route.resourceId;
  const resource = await hook.app.service('resources').get(resourceId);
  hook.params.resource = resource;
  return hook;
};

// Lern-Store can only access public resources, authenticated users can access public resources and resources of their company
const checkPermissionsAfterAuthentication = hook => {
  return getResource(hook).then(resultHook => {
    return authenticateHook()(resultHook)
      .then(result => {
        return getCurrentUserData(result).then(res => {
          return restrictToProviderOrToPublicResources(res);
        });
      })
      .catch(() => {
        return restrictToPublicResources(hook);
      });
  });
};

const distributionHooks = {
  ...defaultHooks,
  before: {
    find: [skipInternal(checkPermissionsAfterAuthentication)]
  }
};

const restrictDelete = hook => {
  const resourceId = hook.id;
  return hook.app
    .service('resource_filepaths')
    .find({ query: { _id: { $in: hook.data.delete || [] } } })
    .then(files => {
      if (
        files.data.every(
          file =>
            file.resourceId &&
            file.resourceId.toString() === resourceId.toString()
        )
      ) {
        return hook; // everything ok
      }
      throw new Error('You are trying to delete some files you do not own.');
    });
};

const manageHooks = {
  ...defaultHooks,
  before: {
    all: [restrictDelete, commonHooks.disallow('external')]
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
    create: [authenticateHook()]
  }
};

const thumbnailHooks = {
  ...thumbnailHook
};

module.exports = {
  distribution: distributionHooks,
  manage: manageHooks,
  structure: structureHooks,
  upload: uploadHooks,
  thumbnail: thumbnailHooks
};
