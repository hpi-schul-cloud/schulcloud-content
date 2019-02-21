const { client } = require('./storage-client.js');
const multiparty = require('multiparty');
const {
  promisePipe,
  removeTrailingSlashes,
  container
} = require('./helperMethods.js');
const { addFileToDB } = require('./fileDBHelper.js');

function getUploadStream(filePath) {
  return client.upload({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}

class FileUploadService {
  constructor(app) {
    this.app = app;
  }

  create(data, { req }) {
    // TODO permission check, content-id must be owned by current user, ...
    // TODO prefix with content-id from query-string
    // TODO prefix with tmp/user-id
    return new Promise((resolve, reject) => {
      const uploadPath = removeTrailingSlashes(req.query.path);
      const form = new multiparty.Form();
      form.on('error', (error) => {
        reject(error);
      });
      form.on('part', part => {
        part.on('error', (/* error */) => {
          // decide what to do
          return reject(400);
        });
        if (part.filename && uploadPath) {
          //writableStream.managedUpload === https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3/ManagedUpload.html
          // managedUpload object allows you to abort ongoing upload or track file upload progress.
          return promisePipe(part, getUploadStream(uploadPath))
            .then((/* result */) => {
              return addFileToDB(this.app, uploadPath)
                .then(() => {
                  return resolve(uploadPath);
                })
                .catch(error => {
                  throw error;
                });
            })
            .catch(error => {
              return reject(error);
              /*
            if(error.statusCode){
              return res.sendStatus(error.statusCode);
            }
            return res.sendStatus(400);
            */
            });
        } else {
          return reject(400);
        }
      });
      form.parse(req);
    });
  }
}

module.exports = {
  FileUploadService
};
