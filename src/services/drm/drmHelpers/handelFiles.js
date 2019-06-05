const fs = require('fs');
const logger = require('winston');
const emptyDir = require('empty-dir');
const { promisePipe, getUploadStream } = require('../../files/storageHelper.js');
const Magic = require('mmmagic').Magic;
const download = require('download-file');
const config = require('config');
const drmConfig = config.get('DRM');
const rmdir = require('rmdir');

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
const videoCleanupOnDelete = (app, resourceId) =>{
  app
  .service('videoId')
  .find({ query: { resourceId: resourceId } })
  .then(searchResults => {
    const currentFiles = searchResults.data;
    const pathWorking =
          drmConfig.absoluteLocalStoragePath +
          '\\' +
          drmConfig.workingDir +
          '\\' +
          currentFiles[0].videoId;
    rmdir(pathWorking);
    currentFiles.map(currentFile =>
      app.service('videoId').remove(currentFile._id)
    );
  });
};
const uploadAndDelete = async (app, resourceFileList, sourceFolderPath) => {
  await Promise.all(
    resourceFileList.map(async element => {
      if (element.upload) {
        await app.service('resource_filepaths').get(element.id.toString()).then(async (resource)=>{
          delete resource._id;
          await app.service('resource_filepaths').create(resource).then(async(newRecource)=>{
            let sourceStream = fs.createReadStream(element.outputFilePath);
            await promisePipe(sourceStream, getUploadStream(newRecource._id));
            app.service('resource_filepaths').patch(element.id.toString(),{path: '/'+drmConfig.originalFilesFolderName+element.path }).then(async()=>{
            });
          });
        });
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

const downloadFile = ({path, name, storageLocation, resourceId}) => {
    let preUrl = `${config.get('protocol')}://${config.get('host')}:${config.get(
      'port'
    )}/files/get/`;
    var url = preUrl + resourceId + path;
  
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
  getFileType,
  videoCleanupOnDelete
};
