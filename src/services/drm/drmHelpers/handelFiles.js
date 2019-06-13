const fs = require('fs');
const logger = require('winston');
const emptyDir = require('empty-dir');
const { getUploadStream, getDownloadStream } = require('../../files/storageHelper.js');
const Magic = require('mmmagic').Magic;
const config = require('config');
const drmConfig = config.get('DRM');

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
          drmProtection: currentFile.drmProtection,
          hidden: currentFile.hidden
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
    currentFiles.map(currentFile =>
      app.service('videoId').remove(currentFile._id)
    );
  });
};

const uploadAndDelete = async (app, resourceFileList, sourceFolderPath) => {
  
  await Promise.all(resourceFileList.map(async element => {
      if (element.upload) {
        await app.service('resource_filepaths').get(element.id.toString()).then(async (resource)=>{
          delete resource._id;
          resource.drmProtection = true;
          await app.service('resource_filepaths').create(resource).then(async(newRecource)=>{
            let sourceStream = fs.createReadStream(element.outputFilePath);
            await finishPromisePipe(sourceStream, getUploadStream(newRecource._id));
            app.service('resource_filepaths').patch(element.id.toString(),
          {
            drmProtection: false,
            path: '/' + drmConfig.originalFilesFolderName+element.path,
            hidden: true
        });
          });
        });
      }
      if (element.remove) {
        if (fs.existsSync(element.sourceFilePath)) {
          fs.unlinkSync(element.sourceFilePath);
        }
        if (fs.existsSync(element.outputFilePath)) {
          fs.unlinkSync(element.outputFilePath);
        }      
      }
      return;
    })
  );

  const isEmpty = emptyDir.sync(sourceFolderPath);
  if (isEmpty) {
    fs.rmdir(sourceFolderPath, err => {
      logger.error(err);
    });
  }
};

function finishPromisePipe(source, target) {
  return new Promise((resolve, reject) => {
    source
      .pipe(target)
      .on('error', error => {
        return reject(error);
      })
      .on('finish', result => {
        return resolve(result);
      });
  });
}


const downloadFiles = async(app, resourceFileList, storageLocation) => {
  if (!fs.existsSync(storageLocation)){
    fs.mkdirSync(storageLocation);
}
  return await Promise.all(
    resourceFileList.map(async element => {
      if (element.drmProtection === false && element.hidden === false) {
        let name = element.id.toString();
        let sourceStream = fs.createWriteStream(storageLocation+'\\'+name);
        return finishPromisePipe(getDownloadStream(name),sourceStream);
      }
    }));
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
  downloadFiles,
  getFileType,
  videoCleanupOnDelete
};
