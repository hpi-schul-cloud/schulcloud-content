const { client } = require("./storage-client.js");
const mime = require('mime-types');
const path = require("path");
const { promisePipe, container } = require("./helperMethods.js");

function fileExists(filePath) {
  filePath = filePath;
  return new Promise((resolve, reject) => {
    return client.getFile(container, filePath, (error, file) => {
      if (error !== null) { return reject(error); }
      return resolve(file);
    });
  });
}

function getDownloadStream(filePath) {
  return client.download({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}

class FileDistributionService {
  constructor(app) {
    this.app = app;
  }

  async find({ req }) {
    const res = req.res;
    const filePath = req.params["0"].replace(/^\//, "");
    // check if file exists to prevent crash during download
    try{
      const fileInfo = await fileExists(filePath);
      const contentType = mime.contentType(path.extname(fileInfo.name)) // 'application/json; charset=utf-8'

      if(contentType){   res.header("Content-Type", contentType); }
      if(fileInfo.etag){ res.header("ETag", fileInfo.etag); }

      return promisePipe(getDownloadStream(filePath), res);
    }catch(error){
      return error
    }
  }
}

module.exports = {
  FileDistributionService
};
