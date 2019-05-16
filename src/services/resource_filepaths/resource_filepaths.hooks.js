//const authenticate = require('../../hooks/authenticate');

const { unifySlashes } = require('../../hooks/unifySlashes');

const unifySlashesHook = hook => {
  if (Array.isArray(hook.data)) {
    hook.data = hook.data.map(unifySlashes('path'));
  } else {
    hook.data = unifySlashes('path')(hook.data);
  }
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
