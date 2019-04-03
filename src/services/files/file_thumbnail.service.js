const request = require('request');
const { uploadFile } = require('./file_upload.service');
const config = require('config');
const pichassoConfig = config.get('pichasso');


class ThumbnailService {
  constructor(app) {
    this.app = app;
  }

  async patch(resourceId, data, params) {
    if (!pichassoConfig.enabled) {
      return 'DISABLED :\'('; // TODO
    }

    const resource = await this.app.service('resources').get(resourceId);

    if(resource.thumbnail){
      return 'SCHON DA ;)'; // TODO
    }

    const fileId = await uploadFile({
      app: this.app,
      userId: undefined,
      resourceId,
      uploadPath: resourceId+'/thumbnail.png',
      sourceStream: request(`${pichassoConfig.url}:${pichassoConfig.port}/thumbnail?file=${resource.url}`)
    });
    await this.app.service('resource_filepaths').patch(fileId, { isTemp: false });
    await this.app.service('resources').patch(resourceId, { thumbnail: `${config.get('protocol')}://${config.get('host')}:${config.get('port')}/files/get/${resourceId}/thumbnail.png` });
    return 'CREATED :D'; // TODO
  }
}

module.exports = {
  ThumbnailService
};