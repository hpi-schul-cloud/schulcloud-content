function addFilesToDB(app, filePaths, {resourceId, userId, isTemp = true, drmProtection = false}) {
  const addPromises = filePaths.map((filePath) => app.service('resource_filepaths').create({
      path: filePath,
      resourceId: resourceId,
      createdBy: userId,
      isTemp: isTemp,
      drmProtection: drmProtection
    })
  );
  return Promise.all(addPromises).then(newFileObjects => {
    const pathDictionary = {};
    newFileObjects.forEach(newFileObject => {
      pathDictionary[newFileObject.path] = newFileObject._id.toString();
    });
    return pathDictionary;
  });
}

function removeFilesFromDB(app, fileIds) {
  // TODO permission check
  const deletePromises = fileIds.map(fileId => app.service('resource_filepaths').remove(fileId));
  return Promise.all(deletePromises);
}

function replaceFilesInDB(app, fileIds) {
  fileIds.map(fileId => {
    const deleteExistingPromise = app.service('resource_filepaths').get(fileId)
      .then(fileObject => {
        const filePath = fileObject.path;
        const resourceId = fileObject.resourceId;
        return app.service('resource_filepaths').find({ query: { _id: { $ne: fileId }, path: filePath, resourceId: resourceId, isTemp: false } });
      })
      .then(searchResults => {
        const currentFiles = searchResults.data;
        // TODO throw error if got >1 file
        // TODO throw error if we got fileId
        const deletePromises = currentFiles.map(currentFile => app.service('resource_filepaths').remove(currentFile._id));
        return Promise.all(deletePromises);
      });

    const publishNewPromise = app.service('resource_filepaths').patch(fileId, { isTemp: false });
    return Promise.all([deleteExistingPromise, publishNewPromise]);
  });
}

module.exports = {
  addFilesToDB,
  replaceFilesInDB,
  removeFilesFromDB
};
