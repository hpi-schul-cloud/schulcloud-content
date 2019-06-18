const { client } = require('./storage-client.js');

function promisePipe(source, target) {
  return new Promise((resolve, reject) => {
    source
      .pipe(target)
      .on('error', error => {
        return reject(error);
      })
      .on('success', result => {
        return resolve(result);
      });
  });
}

function fallbackUndefined(variable, fallback) {
  return variable !== undefined ? variable : fallback;
}

const container = () => process.env['STORAGE_CONTAINER'] || 'resource-hosting';
const filenamePrefix = () =>
  fallbackUndefined(process.env['STORAGE_FILENAME_PREFIX'], 'files/');

function getUploadStream(fileId) {
  return client().upload({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container(),
    remote: filenamePrefix() + fileId.toString()
  });
}

function getDownloadStream(fileId) {
  return client().download({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container(),
    remote: filenamePrefix() + fileId.toString()
  });
}

function fileExists(fileId) {
  return new Promise((resolve, reject) => {
    return client().getFile(
      container(),
      filenamePrefix() + fileId.toString(),
      (error, file) => {
        if (error !== null) {
          return reject(error);
        }
        return resolve(file);
      }
    );
  });
}

function removeFile(fileId) {
  return new Promise((resolve, reject) => {
    return client().removeFile(
      container(),
      filenamePrefix() + fileId.toString(),
      error => {
        if (error !== null) {
          return reject(error);
        }
        return resolve();
      }
    );
  });
}

module.exports = {
  promisePipe,
  getUploadStream,
  getDownloadStream,
  fileExists,
  removeFile,
  container
};
