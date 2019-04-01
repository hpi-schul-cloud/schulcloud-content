//const authenticate = require('../../hooks/authenticate');
const commonHooks = require('feathers-hooks-common');
const defaultHooks = require('./file_default.hook.js');
const authenticate = require('../../hooks/authenticate');
const errors = require('@feathersjs/errors');

const forceHookResolve = forcedHook => {
  return hook => {
    try {
      return forcedHook(hook)
        .then(result => {
          return Promise.resolve(result);
        });
    } catch (error) {
      return Promise.resolve(hook);
    }
  };
};

const hasViewPermission = (hook) => {
  // TODO implement permission check
  if(!hook){
    throw new errors.Forbidden('Permissions missing');
  }
  return;
};

const distributionHooks = {
  ...defaultHooks,
  before: {
    get: [hasViewPermission],
    find: [hasViewPermission],
  }
};

const manageHooks = {
  ...defaultHooks,
  before: {
    all: [commonHooks.disallow('external')]
  }
};

const structureHooks = {
  ...defaultHooks,
  before: {
    get: [forceHookResolve(authenticate)]
  }
};

const uploadHooks = {
  ...defaultHooks,
  before: {
    create: [authenticate]
  }
};

module.exports = {
  distribution: distributionHooks,
  manage: manageHooks,
  structure: structureHooks,
  upload: uploadHooks
};
