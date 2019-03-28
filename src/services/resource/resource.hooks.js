const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');
const createThumbnail = require('../../hooks/createThumbnail');

/*
Anfrage so manipulieren, dass nur isPublished=true angezeigt wird
Außer: userId = currentUser._id (hook.data.userId)
*/
const restrictToPublicIfUnauthorized = (hook) => {
  try{
    hook = authenticate(hook);
    delete hook.params.query.userId;

    if(typeof hook.params.query.isPublished == 'undefined' || hook.params.query.isPublished == 'false'){
      delete hook.params.query.isPublished;
      hook.params.query.$or = [{ isPublished: true }, { userId: hook.data.userId }];
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
  if(!hook.data.files || !hook.data.userId) { return hook; }
  hook = authenticate(hook);
  const files = hook.data.files;
  const fileManagementService = hook.app.service('/files/manage');
  const resourceId = hook.id || hook.result._id.toString();
	return fileManagementService.patch(resourceId, { ...files, userId: hook.data.userId }, hook).then(() => hook);
};

const patchResourceIdInDb = (hook) => {
  let ids;
  try {
    ids = hook.data.files.save;
  } catch (e) {
    if (e instanceof TypeError) {
      return hook;
    }
    throw e;
  }
  const resourceId = hook.id || hook.result._id.toString();
  const replacePromise = hook.app.service('content_filepaths').find({query: { _id: { $in: ids}}}).then(response => {
    const patchList = response.data.map((entry) => {
      if(entry.path.indexOf(resourceId) !== 0){
        let newPath = resourceId + '/' + entry.path;
        return hook.app.service('content_filepaths').patch(entry._id, {resourceId: resourceId, path: newPath});
      }else{
        return Promise.resolve(entry);
      }
    });
    return Promise.all(patchList);
  });
  return replacePromise.then(() => hook);
};

const patchResourceUrlInDb = (hook) => {
  const preUrl = 'http://127.0.0.1:4040/files/get/';
  const resourceId = hook.id || hook.result._id.toString();
  const replacePromise = hook.app.service('resources').get(resourceId).then(response => {
    if(response.url.indexOf(preUrl) == 0){
      let newUrl = response.url.substring(0,preUrl.length) + resourceId + response.url.substring(preUrl.length);
      return hook.app.service('resources').patch(response._id, {url: newUrl});
    }else{
      return Promise.resolve();
    }
  });
  return Promise.all([replacePromise]).then(() => hook);
};

module.exports = {
  before: {
    all: [],
    find: [restrictToPublicIfUnauthorized],
    get: [],
    create: [authenticate, validateResourceSchema(), createThumbnail],
    update: [],
    patch: [patchResourceIdInDb, manageFiles],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [patchResourceIdInDb,manageFiles,patchResourceUrlInDb],
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
