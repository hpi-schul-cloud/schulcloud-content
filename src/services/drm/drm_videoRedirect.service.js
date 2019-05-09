const { downloadFile } = require('./drmHelpers/handelFiles.js');


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
            const fileToOpen = resource.url.split('get/')[1];
            let fileType = fileToOpen.split('.');
            fileType = fileType[fileType.length-1];
            let obj = results.find(
              o =>o.path === fileToOpen
            );
            if (obj.drmProtection && ['mkv', 'mp4', 'gif'].includes(fileType)) {
              return await this.app.service('videoId').find({
                paginate: false,
                query:{
                  resourceId: resourceId
                }
              }).then(async (result)=>{
                const videoId = result[0].videoId;
                await results.map((result) => {
                  return result.path.split('/');
                })
                .filter(splitResult => splitResult[1] == videoId)
                .map(async filterdSplitResult => {
                  const fileName = filterdSplitResult[filterdSplitResult.length-1];
                  const sourceFolderPath = 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\schulcloud-content\\localStorage\\working\\.node_play\\uploader';
                  const subfolder = filterdSplitResult.slice(2, filterdSplitResult.length-1);
                  return await downloadFile(filterdSplitResult.join ('/'), fileName, sourceFolderPath+'\\'+videoId+'\\'+subfolder);
                });
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
