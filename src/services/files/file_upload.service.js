const multiparty = require('multiparty');
const {
  promisePipe,
  removeTrailingSlashes,
  getUploadStream
} = require('./storageHelper.js');
const { addFilesToDB } = require('./fileDBHelper.js');

class FileUploadService {
  constructor(app) {
    this.app = app;
  }

  create(data, { req }) {
    // TODO permission check, content-id must be owned by current user, ...
    if(!req.query.path){
      throw new Error('param \'path\' is missing');
    }
    /* // TODO is optional now
    if(!req.query.contentId){
      throw new Error('param \'contentId\' is missing');
    }
    */
    if(!req.query.userId){
      throw new Error('Unauthorized request');
    }
    return new Promise((resolve, reject) => {
      const uploadPath = removeTrailingSlashes(req.query.path);
      const form = new multiparty.Form();
      form.on('error', (error) => {
        reject({status: 400, message: error});
      });
      form.on('part', part => {
        part.on('error', (error) => {
          return reject({status: 400, message: error});
        });
        if (part.filename && uploadPath) {
          //writableStream.managedUpload === https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3/ManagedUpload.html
          // managedUpload object allows you to abort ongoing upload or track file upload progress.
          return addFilesToDB(this.app, [uploadPath], req.query.contentId, req.query.userId)
            .then((fileIdDictionary) => {
              return promisePipe(part, getUploadStream(fileIdDictionary[uploadPath]))
              .then((/* result */) => {
                return resolve({status: 200, message: fileIdDictionary[uploadPath]});
              });
            })
            .catch(error => {
              if(error.statusCode){
                return reject(reject({status: error.statusCode, message: error}));
              }
              return reject(reject({status: 500, message: error}));
            });
        } else {
          return reject({status: 400});
        }
      });
      form.parse(req);
    });
  }
}

module.exports = {
  FileUploadService
};
