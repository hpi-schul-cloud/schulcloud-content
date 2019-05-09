'use strict';

const { DrmService } = require('./drm_manage.service.js');
const { VideoDrmService } = require('./drm_video.service.js');
const { VideoRedirectService } = require('./drm_videoRedirect.service.js');

const hooks = require('./drm.hooks');

module.exports = function() {
  const app = this;

   /* ##################################################
  # DRM-PROTECTION
  # For internal use only
  # Usage: GET /drm/manage/{resourceId}
  # Result: Protect all files in resource with DRM-Protection
  ################################################## */
  // Initialize our service with any options it requires
  app.use('/drm/manage', new DrmService(app));
  const drmService = app.service('/drm/manage');
  drmService.hooks(hooks.drm);


   /* ##################################################
  # DRM-PROTECTION FOR VIDEOS
  # For internal use only
  # Usage: GET /drm/video/{flowId}
  # Result: Protect all files in resource with DRM-Protection
  ################################################## */
  // Initialize our service with any options it requires
  app.use('/drm/video', new VideoDrmService(app));
  const videoDrmService = app.service('/drm/video');
  videoDrmService.hooks(hooks.video_drm);


  /* ##################################################

  ################################################## */
  // Initialize our service with any options it requires
  app.use('/drm/videoRedirect', new VideoRedirectService(app));
  const videoRedirectService = app.service('/drm/videoRedirect');
  videoRedirectService.hooks(hooks.videoRedirect);
};