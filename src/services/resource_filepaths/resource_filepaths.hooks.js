const { unifySlashes } = require('../../hooks/unifySlashes');

const unifySlashesHook = hook => {
  if (Array.isArray(hook.data)) {
    hook.data = hook.data.map(obj => {
      if (obj.path) {
        obj.path = unifySlashes(obj.path);
      }
      return obj;
    });
  } else if (hook.data.path) {
    hook.data.path = unifySlashes(hook.data.path);
  }
  return hook;
};

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [unifySlashesHook],
    update: [unifySlashesHook],
    patch: [unifySlashesHook],
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
