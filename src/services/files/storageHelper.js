const { client } = require('./storage-client.js');
const { ReadableMock, WritableMock } = require('stream-mock');

function promisePipe(source, target) {
  return new Promise((resolve, reject) => {
    source
      .pipe(target)
      .on('success', result => {
        return resolve(result);
      })
      .on('finish', result => {
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

  if(process.env.NODE_ENV === 'test'){
    return new WritableMock();
  }

  return client.upload({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}

function getDownloadStream(filePath) {

  if(process.env.NODE_ENV === 'test'){
    return new ReadableMock('{"test": true}', {objectMode: true});
  }

  return client.download({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}

function fileExists(filePath) {
  if(process.env.NODE_ENV === 'test' && filePath === 'test.txt'){
    return Promise.resolve({
      name: 'test.txt',
    });
  }
  return new Promise((resolve, reject) => {
    return client.getFile(container, filePath, (error, file) => {
      if (error !== null) { return reject(error); }
      return resolve(file);
    });
  });
}

function removeFile(filePath) {
  if(process.env.NODE_ENV === 'test'){
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    return client.removeFile(container, filePath, (error) => {
      if (error !== null) { return reject(error); }
      return resolve();
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
  removeFile,
  container,
  //addIsPublishFlag
};
