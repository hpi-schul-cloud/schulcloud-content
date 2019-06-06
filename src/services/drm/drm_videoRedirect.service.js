const config = require('config');
const drmConfig = config.get('DRM');

class VideoRedirectService {
  constructor(app) {
    this.app = app;
  }
  async get(resourceId /*obj*/) {
    return await this.app.service('videoId').find({query:{resourceId: resourceId}}).then(async (response)=>{
      if (response.total != 0) {
        return await this.app.service('resources').get(response.data[0].resourceId).then((resource)=>{
          let file = resource.url.split('/');
          let extension = file.slice(file.length-1,file.length)[0].split('.');
          extension = extension.slice(extension.length-1,extension.length)[0];
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
