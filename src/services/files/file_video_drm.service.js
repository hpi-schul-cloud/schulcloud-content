const logger = require('winston');
const rmdir = require('rmdir');
const fs = require('fs');
const path = require('path');
const {
  promisePipe,
  getUploadStream
} = require('./storageHelper.js');


const getFileList = (dir, fileList = [],recursionNr = 1) => {
  fs.readdirSync(dir).forEach(file => {
    if(fs.statSync(path.join(dir, file)).isDirectory()){
      getFileList(path.join(dir, file), fileList,recursionNr+1);
    }else{
      const relativeFilePath = path.join(dir, file).split('\\');
      fileList.push(relativeFilePath.slice(relativeFilePath.length-recursionNr).join('/'));
    }
  });
  return fileList;
};

const addFilesToDB = (app, filePaths, data) => {
  const addPromises = filePaths.map(filePath => app.service('resource_filepaths').create({
    path: data.resourceId + '/' + filePath,
    createdBy: data.createdBy,
    isTemp: data.isTemp,
    resourceId: data.resourceId
    }
  ));
  return Promise.all(addPromises);
};


const absoluteLocalStoragePath = 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\schulcloud-content\\localStorage';
class VideoDrmService {
  constructor(app) {
    this.app = app;
  }
  async get(flow_id, /*obj*/) {
    this.app.service('videoId').find({ query: {
      flow_id: flow_id
    }}).then((result)=>{
      const videoData = result.data[0];
      const pathWorking = absoluteLocalStoragePath + '\\working\\.node_play\\uploader\\' + videoData.videoId;
      const filePaths = getFileList(pathWorking);
      this.app.service('resource_filepaths').get(videoData.fileId).then(async (result) => {
        const resourceId = result.resourceId;
        await addFilesToDB(this.app, filePaths, result);

        await this.app.service('resource_filepaths').find({
          paginate: false,
          query: {
            resourceId: resourceId
          }
        }).then(async (result)=>{
          await Promise.all(
            filePaths.map(async path => {
              let obj = result.find(o => o.path === resourceId+'/'+path);
              let sourceStream = fs.createReadStream(pathWorking+'\\'+path);
              await promisePipe(sourceStream, getUploadStream(obj._id.toString()));
            })
          );
        });
        logger.debug('RM Files');
        const pathFiles = absoluteLocalStoragePath + '\\files\\' +result.resourceId + '\\' + videoData.fileId + '_folder';
        this.app.service('videoId').remove(videoData._id);
        rmdir(pathFiles);
        rmdir(pathWorking);
      });
    });
    return 'ok';
  }
}

module.exports = {
  VideoDrmService
};
