const commonHooks = require('feathers-hooks-common');
const validateResourceSchema = require('../../hooks/validate-resource-schema/');
//const authenticate = require('../../hooks/authenticate');
const { authenticate } = require('@feathersjs/authentication').hooks;
const { populateResourceUrls } = require('../../hooks/populateResourceUrls');
const { unifySlashes } = require('../../hooks/unifySlashes');

// const createThumbnail = require('../../hooks/createThumbnail');
const config = require('config');
const pichassoConfig = config.get('pichasso');

const restrictToPublicIfUnauthorized = async (hook) => {
  /*
  Anfrage so manipulieren, dass nur isPublished=true angezeigt wird
  Außer: userId = currentUser._id ((hook.params.user || {})._id)
  */
  try{
    hook = await authenticate('jwt')(hook);

    if (
      typeof hook.params.query.isPublished == 'undefined' ||
      hook.params.query.isPublished == 'false'
    ) {
      delete hook.params.query.isPublished;
      hook.params.query.$or = [{ isPublished: { $ne: false } }, { userId: (hook.params.user || {})._id }];
    } else {
      hook.params.query.isPublished = { $ne: false };
    }
  } catch (error) {
    hook.params.query.isPublished = { $ne: false };
    return hook;
  }
  return hook;
};

const manageFiles = async (hook) => {
  if(!hook.data.files || !(hook.params.user || {})._id) { return hook; }
  hook = await authenticate('jwt')(hook);

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

const addUserIdToData = hook => {
  if (hook.params.userId) {
    hook.data.userId = hook.params.userId;
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

module.exports = {
  before: {
    all: [],
    find: [restrictToPublicIfUnauthorized],
    get: [],
    create: [
      authenticate('jwt'),
      addUserIdToData,
      unifyLeadingSlashesHook,
      validateNewResources /* createThumbnail, */
    ],
    update: [commonHooks.disallow()],
    patch: [
      authenticate('jwt'),
      addUserIdToData,
      unifyLeadingSlashesHook,
      patchResourceIdInFilepathDb,
      manageFiles
    ],
    remove: [authenticate('jwt'), deleteRelatedFiles]
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
