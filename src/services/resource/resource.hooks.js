const commonHooks = require('feathers-hooks-common');
const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticateHook = require('../../authentication/authenticationHook');
const errors = require('@feathersjs/errors');

const { populateResourceUrls } = require('../../hooks/populateResourceUrls');
const { unifySlashes } = require('../../hooks/unifySlashes');

// const createThumbnail = require('../../hooks/createThumbnail');
const config = require('config');
const pichassoConfig = config.get('pichasso');


const manageFiles = async (hook) => {
  if(!hook.data.files || !(hook.params.user || {})._id) { return hook; }
  hook = await authenticateHook()(hook);

  const files = hook.data.files;
  const fileManagementService = hook.app.service('/files/manage');
  const resourceId = (hook.id || hook.result._id).toString();
  return fileManagementService.patch(resourceId, { ...files, userId: (hook.params.user || {})._id }, hook)
    .then(() => hook);
};

const patchResourceIdInFilepathDb = hook => {
  let ids;
  try {
    ids = hook.data.files.save;
  } catch (e) {
    return hook;
  }
  const resourceId = (hook.id || hook.result._id).toString();
  return hook.app
    .service('resource_filepaths')
    .patch(null, { resourceId }, { query: { _id: { $in: ids } } })
    .then(() => hook);
};

const deleteRelatedFiles = async hook => {
  const resourceId = hook.id;
  const existingFiles = await hook.app
    .service('resource_filepaths')
    .find({ query: { resourceId: resourceId }, paginate: false });
  const filesToRemove = existingFiles.map(entry => entry._id);
  const manageObject = {
    save: [],
    delete: filesToRemove
  };
  await hook.app.service('/files/manage').patch(resourceId, manageObject, hook);
  return hook;
};

const createNewThumbnail = hook => {
  if (pichassoConfig.enabled && !hook.data.thumbnail) {
    const resourceId = hook.id || hook.result._id.toString();
    return hook.app
      .service('files/thumbnail')
      .patch(resourceId, {})
      .then(() => hook);
  }
  return hook;
};

// VALIDATION
const validateResource = hook => {
  if (hook.data.isPublished || (hook.result || {}).isPublished) {
    try {
      validateResourceSchema()(hook);
      return true;
    } catch (error) {
      return false;
    }
  }
  return true;
};

const unpublishInvalidResources = async hook => {
  if (!Array.isArray(hook.result)) {
    // patch single
    hook.data = hook.result;
    if (!validateResource(hook)) {
      hook.result.isPublished = false;
      await hook.app
        .service('resources')
        .patch(hook.result._id, { isPublished: false });
    }
  } else {
    // patch multiple
    const validatePromises = hook.result.map((resource, index) => {
      const newHook = { ...hook }; // copy by value
      newHook.data = resource;
      newHook.result = resource;
      if (!validateResource(newHook)) {
        hook.result[index].isPublished = false;
        return hook.app
          .service('resources')
          .patch(resource._id, { isPublished: false });
      }
    });
    await Promise.all(validatePromises);
  }
  return hook;
};

const validateNewResources = hook => {
  if (!Array.isArray(hook.data)) {
    // create single
    if (hook.data.isPublished && !validateResource(hook)) {
      hook.data.isPublished = false;
    }
  } else {
    // create multiple
    hook.data = hook.data.map(resource => {
      const newHook = { ...hook }; // copy by value
      newHook.data = resource;
      if (!validateResource(newHook)) {
        resource.isPublished = false;
      }
      return resource;
    });
  }
  return hook;
};

const unifySlashesFromResourceUrls = resource => {
  ['url', 'thumbnail'].forEach(key => {
    if (resource[key] && !resource[key].startsWith('http')) {
      resource[key] = unifySlashes(resource[key]);
    }
  });
  return resource;
};

const unifyLeadingSlashesHook = hook => {
  if (Array.isArray(hook.data)) {
    hook.data = hook.data.map(unifySlashesFromResourceUrls);
  } else {
    hook.data = unifySlashesFromResourceUrls(hook.data);
  }
};

/************ PERMISSION CHECK ************/

const checkUserHasRole = (permittedRoles) => async hook => {
  if (!permittedRoles.includes(hook.params.user.role)){
    throw new errors.Forbidden('Permissions missing');
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

const restrictReadAccessToCurrentProvider = async hook => {
  if(hook.params.user.role !== 'superhero') {
    hook.params.query = { providerId: hook.params.user.providerId };
  }
  return hook;
};

const restrictWriteAccessToCurrentProvider = hook => {
  if(hook.params.user.role !== 'superhero') {
    if(Array.isArray(hook.data)) {
      hook.data.forEach((resource)=>{
        resource.providerId = hook.params.user.providerId;
        resource.userId = hook.params.user._id;
      });
    } else {
      hook.data.providerId = hook.params.user.providerId;
      hook.data.userId = hook.params.user._id;
    }
  }
  return hook;
};

const ckeckUserHasPermission = (roles) => hook => {
  return checkUserHasRole(roles)(hook)
  .then(()=>{
    if(hook.method == 'create') {
      return restrictWriteAccessToCurrentProvider(hook);
    } else if (hook.method == 'patch') {
      return restrictReadAccessToCurrentProvider(hook) && restrictWriteAccessToCurrentProvider(hook);
    } else {
      return restrictReadAccessToCurrentProvider(hook);
    }
  });
};

const restrictToProviderOrToPublicResources = hook => {
  if(hook.params.user.role !== 'superhero') {
    hook.params.query = {$or: [
      { providerId: hook.params.user.providerId.toString() },
      { isPublished: true }
    ]};
  }
  return hook;
};

const restrictToPublicResources = hook => {
  hook.params.query = { isPublished: true };
  return hook;
};

// Lern-Store can only access public resources, authenticated users can access public resources and resources of their company
const checkPermissionsAfterAuthentication = hook => {
  return authenticateHook()(hook)
  .then(result => {
    return getCurrentUserData(result) && restrictToProviderOrToPublicResources(result); //TODO: authorized finde will never go into then() - why?
  })
  .catch(()=>{
    return restrictToPublicResources(hook);
  });
};

module.exports = {
  before: {
    all: [],
    find: [checkPermissionsAfterAuthentication],
    get: [
      authenticateHook(),
      getCurrentUserData,
      ckeckUserHasPermission(['superhero', 'admin', 'user'])
    ], //TODO: allow unauthorized access for Lern-Store ?
    create: [
      authenticateHook(),
      getCurrentUserData,
      ckeckUserHasPermission(['superhero', 'admin', 'user']),
      unifyLeadingSlashesHook,
      validateNewResources /* createThumbnail, */
    ],
    update: [commonHooks.disallow()],
    patch: [
      authenticateHook(),
      getCurrentUserData,
      ckeckUserHasPermission(['superhero', 'admin', 'user']),
      unifyLeadingSlashesHook,
      patchResourceIdInFilepathDb,
      manageFiles
    ],
    remove: [ //TODO: wie geht delete bei /resources/bulk?
      authenticateHook(),
      getCurrentUserData,
      ckeckUserHasPermission(['superhero', 'admin', 'user']),
      deleteRelatedFiles
    ]
  },

  after: {
    all: [],
    find: [populateResourceUrls],
    get: [populateResourceUrls],
    create: [
      patchResourceIdInFilepathDb,
      manageFiles,
      createNewThumbnail,
      populateResourceUrls
    ],
    update: [],
    patch: [unpublishInvalidResources, populateResourceUrls],
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
