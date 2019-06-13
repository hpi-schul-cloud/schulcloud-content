const equal = require('fast-deep-equal');
const config = require('config');
const drmConfig = config.get('DRM');
const { removeFile } = require('../../files/storageHelper.js');
const {getFileExtension, isRestoreFile} = require('./drm_dbHelpers');

const restoreOriginalFiles = async (app, resourceId, extensions) => {
    return await app.service('resource_filepaths').find({query:{resourceId},paginate: false}).then(async (files)=>{

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

        await Promise.all(
            files.map(async (entry)=>{
                const extension = getFileExtension(entry.path);
                if (entry.drmProtection && !isRestoreFile(entry.path) && ( extensions === undefined || extensions.includes(extension) ) ) {
                    //Remove modified File
                    removeFile(entry._id);
                    await app.service('resource_filepaths').remove(entry._id);

                }else if (!entry.drmProtection && isRestoreFile(entry.path) && ( extensions === undefined || extensions.includes(extension) ) ) {
                    //Move Original out of OriginalFileFolder
                    let newPath = entry.path.split('/');
                    newPath = '/' + newPath.slice(2, newPath.length).join('/');
                    await app.service('resource_filepaths').patch(entry._id, {path: newPath, drmProtection: false, hidden: false});
                }
                return;
            })
        );
        return;

    });
};
  
  module.exports = {
    restoreOriginalFiles
  };
  