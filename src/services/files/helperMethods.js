const { client } = require('./storage-client.js');

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

const container = process.env['STORAGE_CONTAINER'] || 'content-hosting';

function getUploadStream(filePath) {
  return client.upload({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}

function getDownloadStream(filePath) {
  return client.download({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}

function fileExists(filePath) {
  filePath = filePath;
  return new Promise((resolve, reject) => {
    return client.getFile(container, filePath, (error, file) => {
      if (error !== null) { return reject(error); }
      return resolve(file);
    });
  });
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
  getUploadStream,
  getDownloadStream,
  fileExists,
  container,
  //addIsPublishFlag
};
