function addFilesToDB(app, sourcePaths, options) {
  if(sourcePaths.length === 0){
    return Promise.resolve();
  }
  // TODO make this hack pretty
  let contentId;
  if(options === undefined){
    const userId = sourcePaths[0].split('/')[1]; // TODO
    contentId = sourcePaths[0].split('/')[2]; // TODO
    options = {
      userId: userId,
      isTemporary: true
    };
  }else{
    contentId = sourcePaths[0].split('/')[0]; // TODO
  }

  return app.service('content_filepaths').find({ query: {
      contentId: contentId,
      ...options
    }}).then(response => {
      if(response.total === 0){ // CREATE
        return app
          .service('content_filepaths')
          .create({
            fileIds: sourcePaths,
            contentId: contentId,
            ...options
          });
      }else if(response.total === 1){ // PATCH
        const newFileIds = response.data[0].fileIds
        sourcePaths.forEach((sourcePath) => {
          if(!newFileIds.includes(sourcePath)){
            newFileIds.push(sourcePath);
          }
        })
        return app
          .service('content_filepaths')
          .patch(response.data[0]._id, { fileIds: newFileIds });
      }else{
        throw new Error('Found more than one matching entry');
      }
    });
}

/*
paths: [ 'path1/folder1', ... ]
*/
function removeFilesFromDB(app, paths, contentId) {
  // TODO permission check
  if(paths.length === 0){
    return Promise.resolve();
  }
  return app.service('content_filepaths').find({ query: {
        contentId: contentId,
        fileIds: {
          $in: paths
        } }
      })
      .then(response => {
        const removePromises = response.data.forEach((entry) => {
          const newFileIds = (entry.fileIds).filter(fileId => !paths.includes(fileId));
          return app
            .service('content_filepaths')
            .patch(entry._id, { fileIds: newFileIds });
        });
        return Promise.all(removePromises);
      });
}

/*
paths: [
  {from 'tmp/abc', to: 'abc'},
  ...
]
*/
function moveFilesWithinDB(app, paths, contentId, userId) {
  if(paths.length === 0){
    return Promise.resolve();
  }
  const addPromise = addFilesToDB(app, paths.map(entry => entry.to), { isTemporary: false, userId: userId });
  const removePromise = removeFilesFromDB(app, paths.map(entry => entry.from), contentId);
  return Promise.all([addPromise, removePromise]);
}

module.exports = {
  addFilesToDB,
  moveFilesWithinDB,
  removeFilesFromDB
};
