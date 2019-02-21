//const authenticate = require('../../hooks/authenticate');
const defaultHooks = require('./file_default.hook.js');
const authenticate = require('../../hooks/authenticate');

const distributionHooks = {
  ...defaultHooks,
};

const manageHooks = {
  ...defaultHooks,
};

const structureHooks = {
  ...defaultHooks,
};

const uploadHooks = {
  ...defaultHooks,
  before: {
    create: [authenticate],
  }
};

module.exports = {
  distribution: distributionHooks,
  manage: manageHooks,
  structure: structureHooks,
  upload: uploadHooks,
};
