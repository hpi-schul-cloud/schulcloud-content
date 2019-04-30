const commonHooks = require('feathers-hooks-common');
const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');
// const createThumbnail = require('../../hooks/createThumbnail');
const config = require('config');
const pichassoConfig = config.get('pichasso');

const restrictToPublicIfUnauthorized = (hook) => {
  /*
  Anfrage so manipulieren, dass nur isPublished=true angezeigt wird
  Außer: userId = currentUser._id (hook.params.userId)
  */
  try{
    hook = authenticate(hook);

    if(typeof hook.params.query.isPublished == 'undefined' || hook.params.query.isPublished == 'false'){
      delete hook.params.query.isPublished;
      hook.params.query.$or = [{ isPublished: true }, { userId: hook.params.userId }];
    }else{
      hook.params.query.isPublished = true;
    }
  } catch(error){
    // TODO FIX this line, it's preventing /content/resources from loading
    //hook.params.query["isPublished[$ne]"] = false;
    return hook;
  }
  return hook;
};

const manageFiles = (hook) => {
  if(!hook.data.files || !hook.params.userId) { return hook; }
  hook = authenticate(hook);

  const files = hook.data.files;
  const fileManagementService = hook.app.service('/files/manage');
  const resourceId = (hook.id || hook.result._id).toString();
  return fileManagementService.patch(resourceId, { ...files, userId: hook.params.userId }, hook)
    .then(() => hook);
};

const patchResourceIdInDb = (hook) => {
  let ids;
  try {
    ids = hook.data.files.save;
  } catch (e) {
    return hook;
  }
  const resourceId = (hook.id || hook.result._id).toString();
  const replacePromise = hook.app.service('resource_filepaths').find({query: { _id: { $in: ids}}}).then(response => {
    const patchList = response.data.map((entry) => {
      if(entry.path.indexOf(resourceId) !== 0){
        let newPath = resourceId + '/' + entry.path;
        return hook.app.service('resource_filepaths').patch(entry._id, {resourceId: resourceId, path: newPath});
      }else{
        return Promise.resolve(entry);
      }
    });
    return Promise.all(patchList);
  });
  return replacePromise.then(() => hook);
};

const patchNewResourceUrlInDb = (hook) => {
  if(!hook.data.patchResourceUrl){
    return hook;
  }
  hook.data.patchResourceUrl = false;
  const preUrl = `${config.get('protocol')}://${config.get('host')}:${config.get('port')}/files/get/`;
  const resourceId = hook.id || hook.result._id.toString();
  return hook.app.service('resources').get(resourceId)
    .then(response => {
      let newUrl = preUrl + resourceId + response.url;
      let newThumbnail = preUrl + resourceId + response.thumbnail;
      return hook.app.service('resources').patch(response._id, {url: newUrl, thumbnail: newThumbnail});
    })
    .then((newObj) => {
      hook.result = newObj;
      return hook;
    });
};

const extendResourceUrl = (hook) => {
  if(hook.data.patchResourceUrl && !hook.data.url.startsWith('http')){
    hook.data.patchResourceUrl = false;
    const preUrl = `${config.get('protocol')}://${config.get('host')}:${config.get('port')}/files/get/`;
    const resourceId = hook.id || hook.result._id.toString();
    hook.data.url = preUrl + resourceId + hook.data.url;
    hook.data.thumbnail = preUrl + resourceId + hook.data.thumbnail;
  }
  return hook;
};

const deleteRelatedFiles = async (hook) => {
  const resourceId = hook.id;
  const existingFiles = await hook.app.service('resource_filepaths').find({query: {resourceId: resourceId}});
  const filesToRemove = existingFiles.data.map((entry) => entry._id);
  const manageObject = {
    save: [],
    delete: filesToRemove,
  };
  await hook.app.service('/files/manage').patch(resourceId, manageObject, hook);
  return hook;
};

const createNewThumbnail = (hook) => {
  if (pichassoConfig.enabled && !hook.data.thumbnail){
    const resourceId = hook.id || hook.result._id.toString();
    return hook.app.service('files/thumbnail')
      .patch(resourceId, {})
      .then(() => hook);
  }
  return hook;
};


// VALIDATION
const validateResource = (hook) => {
  if( hook.data.isPublished || (hook.result || {}).isPublished){
    try {
      validateResourceSchema()(hook);
      return true;
    } catch (error) {
      return false;
    }
  }
  return true;
};

const unpublishInvalidResources = async (hook) => {
  if (!Array.isArray(hook.result)) { // patch single
    hook.data = hook.result;
    if(!validateResource(hook)){
      hook.result.isPublished = false;
      await hook.app.service('resources').patch(hook.result._id, { isPublished: false });
    }
  } else { // patch multiple
    const validatePromises = hook.result.map((resource, index) => {
      const newHook = { ...hook }; // copy by value
      newHook.data = resource;
      newHook.result = resource;
      if(!validateResource(newHook)){
        hook.result[index].isPublished = false;
        return hook.app.service('resources').patch(resource._id, { isPublished: false });
      }
    });
    await Promise.all(validatePromises);
  }
  return hook;
};

const validateNewResources = (hook) => {
  if (!Array.isArray(hook.data)) { // create single
    if(hook.data.isPublished && !validateResource(hook)){
      hook.data.isPublished = false;
    }
  } else { // create multiple
    hook.data = hook.data.map((resource) => {
      const newHook = { ...hook }; // copy by value
      newHook.data = resource;
      if(!validateResource(newHook)){
        resource.isPublished = false;
      }
      return resource;
    });
  }
  return hook;
};

module.exports = {
  before: {
    all: [],
    find: [restrictToPublicIfUnauthorized],
    get: [],
    create: [authenticate, validateNewResources, /*createThumbnail, */],
    update: [commonHooks.disallow()],
    patch: [authenticate, patchResourceIdInDb, manageFiles, extendResourceUrl],
    remove: [authenticate, deleteRelatedFiles]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [patchResourceIdInDb, manageFiles, patchNewResourceUrlInDb, createNewThumbnail],
    update: [],
    patch: [unpublishInvalidResources],
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
