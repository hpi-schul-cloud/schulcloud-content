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
  hook = authenticate(hook);
  if(!hook.data.files || !hook.data.userId) { return hook; }
  const files = hook.data.files;
  const fileManagementService = hook.app.service('/files/manage');
	return fileManagementService.patch(hook.id, { ...files, userId: hook.data.userId }, hook).then(() => hook);
};

module.exports = {
  before: {
    all: [],
    find: [restrictToPublicIfUnauthorized],
    get: [],
    create: [authenticate, validateResourceSchema(), createThumbnail],
    update: [],
    patch: [manageFiles],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
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
