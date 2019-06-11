const config = require('config');
const drmConfig = config.get('DRM');
const {getFileExtension} = require('./drmHelpers/drm_dbHelpers.js');

class VideoRedirectService {
  constructor(app) {
    this.app = app;
  }
  async get(resourceId /*obj*/) {
    return await this.app.service('videoId').find({query:{resourceId: resourceId}}).then(async (response)=>{
      if (response.total != 0) {
        return await this.app.service('resources').get(response.data[0].resourceId).then((resource)=>{
          const extension = getFileExtension(resource.url);
          if (drmConfig.videoFileTypes.includes(extension)) {
            return response.data[0].videoId;
          }
          return false;
        });
      }
      return false;
    });
  }
}

module.exports = {
  VideoRedirectService
};
