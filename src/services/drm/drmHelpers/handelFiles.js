const fs = require('fs');
const logger = require('winston');
const emptyDir = require('empty-dir');
const { promisePipe, getUploadStream } = require('../../files/storageHelper.js');
const Magic = require('mmmagic').Magic;
const download = require('download-file');
const config = require('config');

const getResourceFileList = (app, resourceId) => {
    const getFilePathPromise = app
      .service('resource_filepaths')
      .find({
        query: {
          resourceId: resourceId
        }
      })
      .then(async fileObjects => {
        const currentFiles = fileObjects.data;
        return currentFiles.map(currentFile => {
          return {
            id: currentFile._id,
            path: currentFile.path,
            drmProtection: currentFile.drmProtection
          };
        });
      });
    return getFilePathPromise;
  };

const uploadAndDelete = async (app, resourceFileList, sourceFolderPath) => {
  await Promise.all(
    resourceFileList.map(async element => {
      app.service('resource_filepaths').patch(element.id.toString(),{drmProtection: true });
      if (element.upload) {
        let sourceStream = fs.createReadStream(element.outputFilePath);
        await promisePipe(sourceStream, getUploadStream(element.id));
      }

      if (element.remove) {
        fs.unlinkSync(element.sourceFilePath);
        fs.unlinkSync(element.outputFilePath);
      }
    })
  );
  const isEmpty = emptyDir.sync(sourceFolderPath);
  if (isEmpty) {
    fs.rmdir(sourceFolderPath, err => {
      logger.error(err);
    });
  }
};

const downloadFile = (path, name, storageLocation) => {
    let preUrl = `${config.get('protocol')}://${config.get('host')}:${config.get(
      'port'
    )}/files/get`;
    var url = preUrl + path;
  
    var options = {
      directory: storageLocation,
      filename: name
    };
    return new Promise((resolve, reject) => {
      download(url, options, function(err) {
        if (err) reject(err);
        resolve();
      });
    });
  };

  const getFileType = sourceFilePath => {
    return new Promise((resolve, reject) => {
      const magic = new Magic();
      magic.detectFile(sourceFilePath, function(err, result) {
        if (err) reject(err);
        resolve(result);
      });
    });
  };

module.exports = {
  uploadAndDelete,
  getResourceFileList,
  downloadFile,
  getFileType
};
