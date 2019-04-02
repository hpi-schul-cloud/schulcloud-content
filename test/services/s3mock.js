const S3rver = require('s3rver');
const fs = require('fs');

let instance;
const serverDirectory = './test/s3mock';
const container = () => process.env['STORAGE_CONTAINER'] || 'resource-hosting';


const startS3MockServer = () => {
  // CREATE BUCKET
  return new Promise((resolve, reject) => {
    instance = new S3rver({
      port: 9001,
      directory: serverDirectory,
      removeBucketsOnClose: true,
      configureBuckets: [
        {
          name: container(),
        }
      ]
    }).run((err, {address, port}) => {
      if(err) {
        return reject(err);
      }
      process.env['STORAGE_ENDPOINT'] = `http://${address}:${port}`;
      process.env['STORAGE_KEY_ID'] = 'S3RVER';
      process.env['STORAGE_KEY'] = 'S3RVER';
      process.env['STORAGE_FILENAME_PREFIX'] = '';
      resolve();
    });
  });
};

const stopS3MockServer = () => {
  return new Promise((resolve) => {
    instance.close(() => {
      //fs.rmdirSync(serverDirectory);
      resolve();
    });
  });
};

module.exports = {
  startS3MockServer,
  stopS3MockServer,
  serverDirectory,
  container
};