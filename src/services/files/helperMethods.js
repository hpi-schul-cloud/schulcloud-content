function promisePipe(source, target) {
  return new Promise((resolve, reject) => {
    source
      .pipe(target)
      .on('success', result => {
        return resolve(result);
      })
      .on('error', error => {
        return reject(error);
      });
  });
}

function removeTrailingSlashes(filePath) {
  // remove trailing slashes and dots
  return filePath.replace(/^[/.]*/, '');
}

// Script to set isPublished for all existing content
/*
function addIsPublishFlag(app){
  return app.service('resources').find({query: {$limit: false}}).then(response => {
    const patchList = response.data.map((entry) => {
      return app.service('resources').patch(entry._id, {isPublished: true});
    });
    return Promise.all(patchList);
  });
}
*/

module.exports = {
  promisePipe,
  removeTrailingSlashes,
  container: process.env['STORAGE_CONTAINER'] || 'content-hosting',
  //addIsPublishFlag
};
