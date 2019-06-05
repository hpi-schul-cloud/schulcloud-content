const { downloadFile } = require('./drmHelpers/handelFiles.js');
const config = require('config');
const drmConfig = config.get('DRM');
const fs = require('fs');

class VideoRedirectService {
  constructor(app) {
    this.app = app;
  }
  async get(resourceId /*obj*/) {
    return await this.app.service('videoId').find({query:{resourceId: resourceId}}).then((response)=>{
      if (response.total != 0) {
        return response.data[0].videoId;
      }
      return false;
    });
  }
}

module.exports = {
  VideoRedirectService
};
