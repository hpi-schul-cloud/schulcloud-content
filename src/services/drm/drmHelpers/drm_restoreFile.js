const equal = require('fast-deep-equal');
const config = require('config');
const drmConfig = config.get('DRM');
const { removeFile } = require('../../files/storageHelper.js');
const {getFileExtension} = require('./drm_dbHelpers');

const restoreOriginalFiles = async (app, resourceId, extensions) => {
    return app.service('resource_filepaths').find({query:{resourceId},paginate: false}).then((files)=>{

        if (equal(extensions, drmConfig.videoFileTypes)) {
            app.service('videoId').find({query: {resourceId: resourceId}}).then((videoResult)=>{
                if (videoResult.total > 0) {
                    const videoId = videoResult.data[0].videoId;
                    app.service('resource_filepaths');
                    files.forEach((entry)=>{
                        const splitPath = entry.path.split('/');
                        if(splitPath.slice(1, 2) == videoId){
                            removeFile(entry._id);
                            app.service('resource_filepaths').remove(entry._id);
                        }
                    });
                    app.service('videoId').remove(videoResult.data[0]._id);
                }
            });  
        }

        files.forEach((entry)=>{
            const splitPath = entry.path.split('/');
            const extension = getFileExtension(entry.path);
            if (entry.drmProtection && splitPath.slice(1, 2) != drmConfig.originalFilesFolderName && ( extensions === undefined || extensions.includes(extension) ) ) {
                
                removeFile(entry._id);
                app.service('resource_filepaths').remove(entry._id);

            }else if (entry.drmProtection && splitPath.slice(1, 2) == drmConfig.originalFilesFolderName && ( extensions === undefined || extensions.includes(extension) ) ) {
            let newPath = splitPath;
            newPath = '/' + newPath.slice(2, newPath.length).join('/');
            app.service('resource_filepaths').patch(entry._id, {path: newPath, drmProtection: false});
            }
        });
        
        if (extensions === undefined) {
            app.service('resources').patch(resourceId, { $unset: { drmOptions: '' } });
        }
        return;

    });
};
  
  module.exports = {
    restoreOriginalFiles
  };
  