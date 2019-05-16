const mime = require('mime-types');
const path = require('path');
const { unifySlashes } = require('../../hooks/unifySlashes');

const {
  promisePipe,
  getDownloadStream,
  fileExists
} = require('./storageHelper.js');

class FileDistributionService {
  constructor(app) {
    this.app = app;
  }

  find({ req }) {
    const res = req.res;
    const [cleanedPath] = unifySlashes(0)([req.params['0']]);
    let [resourceId, ...filePath] = cleanedPath
      .replace(/\\+/g, '/')
      .replace(/^\/+/g, '')
      .replace(/\/{2,}/g, '/')
      .split('/');
    filePath = '/' + filePath.join('/');

    // get fileId
    return this.app
      .service('resource_filepaths')
      .find({
        query: {
          resourceId: resourceId,
          path: filePath,
          isTemp: false
        }
      })
      .then(async fileObjects => {
        if (fileObjects.data.length === 0) {
          throw new Error('Can\'t find requested file');
        }
        if (fileObjects.data.length > 1) {
          throw new Error('Found more than one matching file');
        }
        const fileId = fileObjects.data[0]._id.toString();

        try {
          // check if file exists to prevent crash during download
          const fileInfo = await fileExists(fileId);

          const contentType = mime.contentType(path.extname(filePath)); // 'application/json; charset=utf-8'
          if (res.header) {
            if (contentType) {
              res.header('Content-Type', contentType);
            }
            if (fileInfo.etag) {
              res.header('ETag', fileInfo.etag);
            }
          }

          return promisePipe(getDownloadStream(fileId), res);
        } catch (error) {
          throw error;
        }
      });
  }
}

module.exports = {
  FileDistributionService
};
