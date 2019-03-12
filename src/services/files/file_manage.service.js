const { removeFilesFromDB, replaceFilesInDB } = require('./fileDBHelper.js');
const {
  removeFile
} = require('./storageHelper.js');


class FileManageService {
  constructor(app) {
    this.app = app;
  }

  patch(contentId, data) {
    // TODO permission check, contentId must be owned by current user, ...

    const deleteOperationIds = (data.delete || []); // id array
    const moveOperationIds = (data.save || []); // id array

    try{
      const deletePromises = deleteOperationIds.map(deleteOperationId => {
        return removeFile(deleteOperationId);
      });

      const manageDeletePromise = removeFilesFromDB(this.app, deleteOperationIds);

      const manageMovePromise = replaceFilesInDB(this.app, moveOperationIds);

      return Promise.all([manageDeletePromise, manageMovePromise, deletePromises]).then(() => {
        return { status: 200 };
      });
    }catch(error){
        if (error.statusCode) {
          return { status: error.statusCode };
        }
        return { status: 500, message: error };
      }
  }
}

module.exports = {
  FileManageService
};
