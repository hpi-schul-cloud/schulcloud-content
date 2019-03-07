function addFilesToDB(app, filePaths, contentId, userId) {
  const addPromises = filePaths.map((filePath) => app.service('content_filepaths').create({
      path: filePath,
      contentId: contentId,
      createdBy: userId,
      isTemp: true,
    })
  );
  return Promise.all(addPromises).then(newFileObjects => {
    const pathDictionary = {};
    newFileObjects.forEach(newFileObject => {
      pathDictionary[newFileObject.path] = newFileObject._id;
    });
    return pathDictionary;
  });
}

function removeFilesFromDB(app, fileIds) {
  // TODO permission check
  const deletePromises = fileIds.map(fileId => app.service('content_filepaths').remove(fileId));
  return Promise.all(deletePromises);
}

function replaceFilesInDB(app, fileIds) {
  fileIds.map(fileId => {
    const deleteExistingPromise = app.service('content_filepaths').get(fileId)
      .then(fileObject => {
        const filePath = fileObject.path;
        return app.service('content_filepaths').find({ query: { _id: { $ne: fileId }, path: filePath, isTemp: false } });
      })
      .then(searchResults => {
        const currentFiles = searchResults.data;
        // TODO throw error if got >1 file
        // TODO throw error if we got fileId
        const deletePromises = currentFiles.map(currentFile => app.service('content_filepaths').remove(currentFile._id));
        return Promise.all(deletePromises);
      });

    const publishNewPromise = app.service('content_filepaths').patch(fileId, { isTemp: false });
    return Promise.all([deleteExistingPromise, publishNewPromise]);
  });
}

module.exports = {
  addFilesToDB,
  replaceFilesInDB,
  removeFilesFromDB
};
