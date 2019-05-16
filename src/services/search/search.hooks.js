const { populateResourceUrls } = require('../../hooks/populateResourceUrls');

const allowDisableLimit = hook => {
  if (hook.params.query.$limit === '-1') {
    hook.params.paginate = false;
    hook.params.query.$limit = 10000; // just deleting $limit causes the default value :(
  }
  return hook;
};

module.exports = {
  before: {
    all: [],
    find: [allowDisableLimit],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [populateResourceUrls],
    get: [populateResourceUrls],
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
