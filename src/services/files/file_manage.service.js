const { removeFilesFromDB, moveFilesWithinDB } = require('./fileDBHelper.js');
const {
  promisePipe,
  removeTrailingSlashes,
  fileExists,
  getDownloadStream,
  getUploadStream,
  removeFile
} = require('./helperMethods.js');

async function moveFile(from, to) {
  try {
    await fileExists(from);
    const downloadStream = getDownloadStream(from);
    const uploadStream = getUploadStream(to);
    return promisePipe(downloadStream, uploadStream).then(
      () => `moved from '${from}' to '${to}'`
    );
  } catch (error) {
    return error;
  }
}

class FileManageService {
  constructor(app) {
    this.app = app;
  }

  patch(contentId, data) {
    // TODO permission check, contentId must be owned by current user, ...

    const tmpPrefix = `tmp/${data.userId}/`;

    const deleteOperations = (data.delete || []).map(sourcePath => removeTrailingSlashes(sourcePath));
    const moveOperations = (data.save || []).map(tmpfilepath => {
      return {
        from: tmpfilepath,
        to: removeTrailingSlashes(tmpfilepath).replace(tmpPrefix, '')
      };
    });

    const deletePromises = deleteOperations.map(sourcePath => {
      return removeFile(sourcePath);
    });
    const movePromises = moveOperations.map(operation => {
      return moveFile(operation.from, operation.to);
    });
    return Promise.all(Object.assign(deletePromises, movePromises))
      .then(() => {

        const manageDeletePromise = removeFilesFromDB(this.app, deleteOperations, contentId);

        const manageMovePromise = moveFilesWithinDB(this.app, moveOperations, contentId, data.userId);

        const manageDeleteTmpPromise = Promise.all(
          moveOperations.map((operation) => removeFile(operation.from))
        );

        return Promise.all([manageDeletePromise, manageMovePromise, manageDeleteTmpPromise]).then(() => {
          return { status: 200 };
        });
      })
      .catch(error => {
        if (error.statusCode) {
          return { status: error.statusCode };
        }
        return { status: 500, message: error };
      });
  }
}

module.exports = {
  FileManageService
};
