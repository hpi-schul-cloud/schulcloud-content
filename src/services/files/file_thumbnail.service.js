const request = require('request');
const { uploadFile } = require('./file_upload.service');



class ThumbnailService {
  constructor(app) {
    this.app = app;
  }

  async patch(resourceId, data, params) {
    const resource = await this.app.service('resources').get(resourceId);
    uploadFile({
      app: this.app,
      userId: undefined,
      resourceId,
      uploadPath: resourceId+'/thumbnail.png',
      sourceStream: request('http://127.0.0.1:3000/thumbnail?file='+resource.url)
    }).then((fileId)=>{
      this.app.service('resource_filepaths').patch(fileId, { isTemp: false });
    });
  }
}

module.exports = {
  ThumbnailService
};