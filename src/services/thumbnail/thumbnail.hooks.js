const addAccessToken = (hook) => {
    return hook.app.service('access_token').create({resourceId: 'TODO'}).then((resource) => {
        hook.data.access_token = resource._id;
        return hook;
    });
};

const removeAccessToken = (hook) => {
    return hook.app.service('access_token').remove(hook.data.access_token).then(() => hook);
};

module.exports = {
    before: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [addAccessToken],
      patch: [addAccessToken],
      remove: []
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [removeAccessToken],
      patch: [removeAccessToken],
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
  