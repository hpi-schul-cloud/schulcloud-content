const mv = require('mv');
const axios = require('axios');
const config = require('config');
const drmConfig = config.get('DRM');
const {getFileName} = require('./drm_dbHelpers.js');

const createVideoDrm = (app, element, resourceId) => {
  const fileName = getFileName(element.path);
  element.remove = false;
  mv(
    element.sourceFilePath,
    element.sourceFilePath + '_folder' + '\\' + fileName,
    { mkdirp: true },
    async error => {
      if (error != undefined) {
        throw error;
      }
      await axios
        .get(
          drmConfig.nodePlay.protocol +
            '://' +
            drmConfig.nodePlay.host +
            ':' +
            drmConfig.nodePlay.port +
            '/api/queue/add/' +
            fileName +
            '?folderName=' +
            resourceId +
            '\\' +
            element.id +
            '_folder'
        )
        .then(async id => {
          await axios
            .get(
              drmConfig.nodePlay.protocol +
                '://' +
                drmConfig.nodePlay.host +
                ':' +
                drmConfig.nodePlay.port +
                '/api/status/' +
                id.data
            )
            .then(response => {
              app.service('videoId').create({
                videoId: response.data.id,
                flow_id: response.data.queue_id,
                fileId: element.id,
                resourceId: resourceId
              });
            });
        })
        .catch(error => {
          throw error;
        });
    }
  );
};

module.exports = {
  createVideoDrm
};
