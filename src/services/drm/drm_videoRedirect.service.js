const { downloadFile } = require('./drmHelpers/handelFiles.js');
const config = require('config');
const drmConfig = config.get('DRM');
const fs = require('fs');

class VideoRedirectService {
  constructor(app) {
    this.app = app;
  }
  async get(resourceId /*obj*/) {
    const respond = await new Promise(async (resolve) =>{
      try {
        const respond = await this.app.service('resources').get(resourceId).then(async (resource)=>{
          return await this.app.service('resource_filepaths').find({
            paginate: false,
            query:{
              resourceId: resourceId
            }
          }).then(async (results)=>{
            let fileToOpen = resource.url.split('/');
            fileToOpen = fileToOpen[fileToOpen.length-1];
            let fileType = fileToOpen.split('.');
            fileType = fileType[fileType.length-1];
            let obj = results.find(
              o =>o.path === '/' + fileToOpen
            );
            if (obj.drmProtection && drmConfig.videoFileTypes.includes(fileType)) {
              return await this.app.service('videoId').find({
                paginate: false,
                query:{
                  resourceId: resourceId
                }
              }).then(async (result)=>{
                const videoId = result[0].videoId;
                const sourceFolderPath = drmConfig.absoluteLocalStoragePath + '\\' + drmConfig.workingDir;
                if (!fs.existsSync(sourceFolderPath +'/' + videoId)) {
                  await Promise.all(results.map((result) => {
                    return result.path.split('/');
                  })
                  .filter(splitResult => splitResult[1] == videoId)
                  .map(async filteredSplitResult => {
                    const fileName = filteredSplitResult[filteredSplitResult.length-1];          
                    const subFolder = filteredSplitResult.slice(2, filteredSplitResult.length-1);
                    const options = {
                      path: filteredSplitResult.join('/'),
                      name: fileName,
                      storageLocation: sourceFolderPath+'\\'+videoId+'\\'+subFolder,
                      resourceId: resourceId
                    };
                    return await downloadFile(options);
                  })
                  );
                }
                return {
                  redirect: true,
                  videoId: videoId
                };
              });
            } else {
              return {
                redirect: false,
              };
            }
          });
        });
        resolve(respond);
       } catch (error) {
         if (error.name == 'NotFound') {
          return {
            redirect: false,
          };
         }
       }
    });
    return respond;
    
  }
}

module.exports = {
  VideoRedirectService
};
