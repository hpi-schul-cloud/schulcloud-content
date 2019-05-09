const logger = require('winston');
const rmdir = require('rmdir');
const fs = require('fs');
const path = require('path');
const config = require('config');
const drmConfig = config.get('DRM');
const emptyDir = require('empty-dir');
const { promisePipe, getUploadStream } = require('../files/storageHelper.js');
const {addFilesToDB} = require('../files/fileDBHelper.js');

const getFileList = (dir, fileList = [], recursionNr = 1) => {
  fs.readdirSync(dir).forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      getFileList(path.join(dir, file), fileList, recursionNr + 1);
    } else {
      const relativeFilePath = path.join(dir, file).split('\\');
      fileList.push(
        relativeFilePath.slice(relativeFilePath.length - recursionNr).join('/')
      );
    }
  });
  return fileList;
};

class VideoDrmService {
  constructor(app) {
    this.app = app;
  }
  async get(flow_id /*obj*/) {
    this.app
      .service('videoId')
      .find({
        query: {
          flow_id: flow_id
        }
      })
      .then(result => {
        const videoData = result.data[0];
        const pathWorking =
          drmConfig.absoluteLocalStoragePath +
          '\\' +
          drmConfig.workingDir +
          '\\' +
          videoData.videoId;
        const filePaths = getFileList(pathWorking);
        this.app
          .service('resource_filepaths')
          .get(videoData.fileId)
          .then(async result => {
            const dbFilePaths = filePaths.map(filePath => result.resourceId + '/' + videoData.videoId + '/' + filePath);
            const options = {
              resourceId: result.resourceId,
              createdBy: result.createdBy,
              isTemp: result.isTemp,
              drmProtection: true
            };
            await addFilesToDB(this.app, dbFilePaths, options);
            await this.app
              .service('resource_filepaths')
              .find({
                paginate: false,
                query: {
                  resourceId: videoData.resourceId
                }
              })
              .then(async result => {
                await Promise.all(
                  filePaths.map(async path => {
                    let obj = result.find(
                      o =>
                        o.path ===
                        videoData.resourceId +
                          '/' +
                          videoData.videoId +
                          '/' +
                          path
                    );
                    let sourceStream = fs.createReadStream(
                      pathWorking + '\\' + path
                    );
                    await promisePipe(
                      sourceStream,
                      getUploadStream(obj._id.toString())
                    );
                  })
                );
              });
            logger.debug('Remove Files from Disk');
            const pathFiles =
              drmConfig.absoluteLocalStoragePath +
              '\\' +
              drmConfig.downloadDir +
              '\\' +
              result.resourceId;
            const pathVideoFiles =
              pathFiles + '\\' + videoData.fileId + '_folder';

            //rmdir(pathWorking);
            rmdir(pathVideoFiles,()=>{
              const isEmpty = emptyDir.sync(pathFiles);
              if (isEmpty) {
                fs.rmdir(pathFiles, err => {
                  logger.error(err);
                });
              }
            });
           

          });
      });
    return 'ok';
  }
}

module.exports = {
  VideoDrmService
};
