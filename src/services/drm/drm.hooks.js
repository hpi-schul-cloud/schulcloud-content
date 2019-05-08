const defaultHooks = require('./drm_default.hook.js');

const drmHooks = {
  ...defaultHooks,
};

const videoDrmHooks = {
  ...defaultHooks,
};

module.exports = {
  drm: drmHooks,
  video_drm: videoDrmHooks
};
