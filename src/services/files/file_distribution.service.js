const mime = require('mime-types');
const path = require('path');
const { promisePipe, getDownloadStream, fileExists } = require('./storageHelper.js');



class FileDistributionService {
  constructor(app) {
    this.app = app;
  }

  find({ req }) {
    const res = req.res;
    const filePath = req.params['0'].replace(/^\//, '');

    // get fileId
    return this.app.service('content_filepaths').find({ query: {
        path: filePath,
        isTemp: false
      } })
      .then(async fileObjects => {
        // TODO what happens if we got more than 1 result?
        if(fileObjects.data.length === 0){
          throw 'Can\'t find requested file';
        }
        const fileId = fileObjects[0]._id;

        try{
          // check if file exists to prevent crash during download
          const fileInfo = await fileExists(fileId);

          const contentType = mime.contentType(path.extname(fileInfo.name)); // 'application/json; charset=utf-8'
          if(res.header){
            if(contentType){   res.header('Content-Type', contentType); }
            if(fileInfo.etag){ res.header('ETag', fileInfo.etag); }
          }

          return promisePipe(getDownloadStream(fileId), res);
        }catch(error){
          return error;
        }

      })
      .catch(error => {
        return error;
      });
  }
}

module.exports = {
  FileDistributionService
};
