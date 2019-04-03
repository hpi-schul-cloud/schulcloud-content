const errors = require('@feathersjs/errors');
const request = require('request');
const rpn = require('request-promise-native');

const config = require('config');
const pichassoConfig = config.get('pichasso');
const { uploadFile } = require('./file_upload.service');

const api = rpn.defaults({
  resolveWithFullResponse: true
});

class PreconditionFailed extends errors.FeathersError {
  constructor(message, data) {
    super(message, 'precondition-failed', 412, 'PreconditionFailed', data);
  }
}

class ThumbnailService {
  constructor(app) {
    this.app = app;
  }

  async patch(resourceId /*, data, params */) {
    if (!pichassoConfig.enabled) {
      throw new errors.Unavailable('service disabled');
    }

    const resource = await this.app.service('resources').get(resourceId);

    if(resource.thumbnail){
      throw new PreconditionFailed('thumbnail already exists');
    }

    const pichassoHost = `${pichassoConfig.url}:${pichassoConfig.port}`;

    // get auth token from pichasso
    const verifyUrl = `${pichassoHost}/thumbnail/verify/${pichassoConfig.token}/${encodeURIComponent(resource.url)}`;
    const verifyResponse = await api.get(verifyUrl);

    // verify token
    if (verifyResponse.statusCode !== 200) {
      throw new errors.GeneralError('verification failed getting thumbnail url');
    }
    const authtoken = verifyResponse.body;
    if(!authtoken || authtoken.length !== 6){
      throw new errors.GeneralError('received token seems to be wrong');
    }

    // create thumbnail
    const fileId = await uploadFile({
      app: this.app,
      userId: undefined,
      resourceId,
      uploadPath: resourceId+'/thumbnail.png',
      sourceStream: request(`${pichassoHost}/thumbnail?auth=${authtoken}&file=${resource.url}`)
    });
    // publish thumbnail
    await this.app.service('resource_filepaths').patch(fileId, { isTemp: false });
    // patch thumbnail into resource
    await this.app.service('resources').patch(resourceId, { thumbnail: `${config.get('protocol')}://${config.get('host')}:${config.get('port')}/files/get/${resourceId}/thumbnail.png` });

    return `{code: 200, message: ${fileId}}`;
  }
}

module.exports = {
  ThumbnailService
};