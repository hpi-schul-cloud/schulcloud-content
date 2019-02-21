const { removeFileFromDB, moveFileWithinDB } = require('./fileDBHelper.js');

async function moveFile(from, to) {
  try{
    await fileExists(from);
    const downloadStream = getDownloadStream(from);
    const uploadStream = getUploadStream(to);
    return promisePipe(downloadStream, uploadStream);
  }catch(error){
    res.sendStatus(404);
  }
}


function removeFile(filePath) {
  return new Promise((resolve, reject) => {
    return client.removeFile(container, filePath, (error) => {
      if (error !== null) { return reject(error); }
      return resolve();
    });
  });
}

class FileManageService {
  constructor(app) {
    this.app = app;
  }

  create(data, { req }) {
    // TODO permission check, content-id must be owned by current user, ...
    // TODO prefix with content-id from query-string
    // TODO prefix with tmp/user-id
    const tmpPrefix = "/tmp/u-id/";
    const deleteOperations = (req.body.delete || []);
    const moveOperations = (req.body.save || []);

    const deletePromises = deleteOperations.map((sourcePath) => {
      const filePath = removeTrailingSlashes(sourcePath);
      return removeFile(filePath);
    });
    const movePromises = moveOperations.map((sourcePath) => {
      const filePath = removeTrailingSlashes(sourcePath);
      return moveFile(tmpPrefix + filePath, filePath);
    });
    return Promise.all([...deletePromises, ...movePromises])
      .then(() =>{
        deleteOperations.forEach((sourcePath) => {
          removeFileFromDB(this.app, sourcePath)
        })
        moveOperations.forEach((sourcePath) => {
          moveFileWithinDB(this.app, {from: (tmpPrefix + sourcePath), to: sourcePath})
        })
        res.sendStatus(200);
      }).catch((error) => {
        if(error.statusCode){
          return error.statusCode
        }
        return 500
      });
  }
}

module.exports = {
  FileManageService
};
