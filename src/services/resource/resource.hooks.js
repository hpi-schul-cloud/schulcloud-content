const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');
const createThumbnail = require('../../hooks/createThumbnail');

/*
Anfrage so manipulieren, dass nur isPublished=true angezeigt wird
Außer: userId = currentUser._id (hook.data.userId)
*/

const myHook = (hook) => {
  try{
    
    hook = authenticate(hook);
    delete hook.params.query.userId

    if(typeof hook.params.query.isPublished == 'undefined' || hook.params.query.isPublished == 'false'){
      delete hook.params.query.isPublished
      hook.params.query.$or = [{ isPublished: true }, { userId: hook.data.userId }];
    }else{
      hook.params.query.isPublished = true;
    }
  } catch(error){
    console.log(error);
    hook.params.query.isPublished = true;
  } 
  return hook;
}


module.exports = {
  before: {
    all: [],
    find: [myHook],
    get: [],
    create: [authenticate, validateResourceSchema(), createThumbnail],
    update: [],
    patch: [],
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
