const logger = require('winston');
const multiparty = require('multiparty');
const {
  promisePipe,
  removeTrailingSlashes,
  getUploadStream
} = require('./storageHelper.js');
const { addFilesToDB } = require('./fileDBHelper.js');

const uploadFile = ({app, resourceId, userId, uploadPath, sourceStream}) => {
  return addFilesToDB(app, [uploadPath], resourceId, userId)
    .then((fileIdDictionary) => {
      return promisePipe(sourceStream, getUploadStream(fileIdDictionary[uploadPath]))
        .then(() => fileIdDictionary[uploadPath]);
    });
};

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
    if(!req.query.resourceId){
      throw new Error('param \'resourceId\' is missing');
    }
    */
    if(!data.userId){
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
          return uploadFile({
            app: this.app,
            userId: data.userId,
            resourceId: req.query.resourceId,
            uploadPath,
            sourceStream: part
          }).then((uploadedId) => {
            return resolve({status: 200, message: uploadedId});
          })
          .catch(error => {
            logger.error(error);
            if(error.statusCode){
              return reject({status: error.statusCode, message: error});
            }
            return reject({status: 500, message: error});
          });
            
        } else {
          if(!uploadPath){
            logger.error('uploadPath (req.query.path) is missing.');
          }else{
            logger.error('part is no file.');
          }
          return reject({status: 400});
        }
      });
      form.parse(req);
    });
  }
}

module.exports = {
  FileUploadService,
  uploadFile
};
