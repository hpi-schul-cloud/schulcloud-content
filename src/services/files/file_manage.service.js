const { removeFileFromDB, moveFileWithinDB } = require('./fileDBHelper.js');
const { promisePipe, removeTrailingSlashes, fileExists, getDownloadStream, getUploadStream, removeFile } = require('./helperMethods.js');

async function moveFile(from, to) {
  try{
    await fileExists(from);
    const downloadStream = getDownloadStream(from);
    const uploadStream = getUploadStream(to);
    return promisePipe(downloadStream, uploadStream).then(() => `moved from "${from}" to "${to}"`);
  }catch(error){
    return error;
  }
}

class FileManageService {
  constructor(app) {
    this.app = app;
  }

  patch(contentId, data) {
    console.log("DATA", data);
    // TODO permission check, contentId must be owned by current user, ...
    const tmpPrefix = `tmp/${data.userId}/`;
    const deleteOperations = (data.delete || []);
    const moveOperations = (data.save || []);

    const deletePromises = deleteOperations.map((sourcePath) => {
      const filePath = removeTrailingSlashes(sourcePath);
      return removeFile(filePath);
    });
    const movePromises = moveOperations.map((sourcePath) => {
      const filePath = removeTrailingSlashes(sourcePath);
      const targetPath = filePath.replace(tmpPrefix, '');
      console.log("move", filePath, targetPath);
      return moveFile(filePath, targetPath);
    });
    const operations = Object.assign(deletePromises, movePromises);
    return Promise.all(operations).then((result) =>{
        console.log("MANAGED:", result);
        // TODO @elias Until here, it should work, than I stopped working and left. ;)
        // Notice, after moving a file, we forgot to remove it (tmp files) so this should be done here as well. But do this last.
        deleteOperations.forEach((sourcePath) => {
          removeFileFromDB(this.app, sourcePath)
        })
        moveOperations.forEach((sourcePath) => {
          moveFileWithinDB(this.app, { from: sourcePath, to: sourcePath.replace(tmpPrefix, '') })
        })
        return { status: 200 };
      }).catch((error) => {
        console.log("ERROR:", error);

        if(error.statusCode){
          return { status: error.statusCode };
        }
        return { status: 500 }
      });
  }
}

module.exports = {
  FileManageService
};
