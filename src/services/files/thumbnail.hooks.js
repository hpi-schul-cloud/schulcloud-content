const commonHooks = require('feathers-hooks-common');

// resource need to be published for pichasso
const temporarilyPublishResource = async (hook) => {
  const resource = await hook.app.service('resources').get(hook.id);
  hook.params.resource = resource;
  await hook.app.service('resources').patch(resource._id, {isPublished: true});
  return hook;
};
const unpublishResource = async (hook) => {
  await hook.app.service('resources').patch(hook.params.resource._id, {isPublished: hook.params.resource.isPublished});
  return hook;
};

module.exports = {
    before: {
      all: [commonHooks.disallow('external')],
      find: [],
      get: [],
      create: [],
      update: [temporarilyPublishResource],
      patch: [temporarilyPublishResource],
      remove: []
    },

    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [unpublishResource],
      patch: [unpublishResource],
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
