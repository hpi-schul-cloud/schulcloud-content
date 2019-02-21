const multiparty = require('multiparty');
const {
  promisePipe,
  removeTrailingSlashes,
  getUploadStream
} = require('./helperMethods.js');
const { addFileToDB } = require('./fileDBHelper.js');

class FileUploadService {
  constructor(app) {
    this.app = app;
  }

  create(data, { req }) {
    // TODO permission check, content-id must be owned by current user, ...
    return new Promise((resolve, reject) => {
      const uploadPath = `tmp/${data.userId}/${removeTrailingSlashes(req.query.path)}`;
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
          return promisePipe(part, getUploadStream(uploadPath))
            .then((/* result */) => {
              return addFileToDB(this.app, uploadPath)
                .then(() => {
                  return resolve({status: 200, message: uploadPath});
                })
                .catch(error => {
                  throw error;
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
