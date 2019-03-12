const S3rver = require('s3rver');
const fs = require('fs');

let instance;
const serverDirectory = './test/s3mock';
const container = process.env['STORAGE_CONTAINER'] || 'content-hosting';


const startS3MockServer = () => {
  // CREATE BUCKET
  const bucketDir = `${serverDirectory}/${container}`;
  if (!fs.existsSync(bucketDir)){
    fs.mkdirSync(bucketDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    instance = new S3rver({
      port: 9001,
      directory: serverDirectory,
      removeBucketsOnClose: true
    }).run((err, host, port) => {
      if(err) {
        return reject(err);
      }
      process.env['STORAGE_ENDPOINT'] = `http://${host}:${port}`;
      process.env['STORAGE_KEY'] = 'STORAGE_KEY';
      resolve();
    });
  });
};

const stopS3MockServer = () => {
  return new Promise((resolve) => {
    instance.close(() => {
      fs.rmdirSync(serverDirectory);
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