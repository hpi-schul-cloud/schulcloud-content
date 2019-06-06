const config = require('config');
const drmConfig = config.get('DRM');
const { removeFile } = require('../../files/storageHelper.js');


const restoreOriginalFiles = async (app, resourceId) => {
    app.service('resource_filepaths').find({query:{resourceId},paginate: false}).then((result)=>{
        
        result.forEach((entry)=>{
            if (entry.drmProtection && entry.path.split('/').slice(1, 2) != drmConfig.originalFilesFolderName) {
            removeFile(entry._id);
            app.service('resource_filepaths').remove(entry._id);

            }else if (entry.drmProtection && entry.path.split('/').slice(1, 2) == drmConfig.originalFilesFolderName) {
            let newPath = entry.path.split('/');
            newPath = '/' + newPath.slice(2, newPath.length).join('/');
            app.service('resource_filepaths').patch(entry._id, {path: newPath, drmProtection: false});
            }
        });

        app.service('videoId').find({query: {resourceId: resourceId}}).then((result)=>{
            app.service('videoId').remove(result.data[0]._id);
        });
        app.service('resources').patch(resourceId, { $unset: { drmOptions: '' } });
    
    });
};
  
  module.exports = {
    restoreOriginalFiles
  };
  