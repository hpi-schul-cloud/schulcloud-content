// Application hooks that run for every service
const logger    = require('./hooks/logger');
const jsonapify = require('./hooks/jsonapify/index');

module.exports = {
  before: {
    all: [ jsonapify() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [ logger(), jsonapify() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [ logger(), jsonapify() ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
