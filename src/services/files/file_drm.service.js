const logger = require('winston');
const qpdf = require('node-qpdf');
const watermark = require('dynamic-watermark');
const gm = require('gm');
const fs = require('fs');
const download = require('download-file');
const config = require('config');
const Magic = require('mmmagic').Magic;
const mv = require('mv');
const axios = require('axios');
const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const emptyDir = require('empty-dir');
const { promisePipe, getUploadStream } = require('./storageHelper.js');

const ep = new exiftool.ExiftoolProcess(exiftoolBin);
const logoFilePath = 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\temp\\c.png';
const absoluteLocalStoragePath = 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\schulcloud-content\\localStorage';

const testDataToWrite = {
  all: '', // remove existing tags
  comment: 'Exiftool rules!',
  'Keywords+': ['TestKeyWordNr1', 'TestKeyWordNr2'],
  CreatorAddress: 'test Adress',
  CreatorWorkEmail: 'testmail@test.de',
  CreatorWorkURL: 'test.me',
  ModelAge: '18',
  Nickname: 'testNick',
  Description: 'TestDescription',
  Creator: 'TestCreator'
};

function getImageSize(localFilePath) {
  return new Promise((resolve, reject) => {
    gm(localFilePath).size(async function(err, size) {
      if (!err) {
        size = {
          width: size.width,
          height: size.height
        };
        resolve(size);
      } else {
        reject(undefined);
      }
    });
  });
}

const writeExifData = async (data, path) => {
  await ep.writeMetadata(path, data, ['-File:all', 'overwrite_original']);
};

const getResourceFileList = (app, resourceId) => {
  const getFilePathPromise = app
    .service('resource_filepaths')
    .find({
      query: {
        resourceId: resourceId
      }
    })
    .then(async fileObjects => {
      const currentFiles = fileObjects.data;
      const filePaths = currentFiles.map(currentFile => {
        return {
          id: currentFile._id,
          path: currentFile.path
        };
      });
      return filePaths;
    });
  return getFilePathPromise;
};

const downloadFile = (path, name, storageLocation) => {
  let preUrl = `${config.get('protocol')}://${config.get('host')}:${config.get(
    'port'
  )}/files/get`;
  var url = preUrl + path;

  var options = {
    directory: storageLocation,
    filename: name
  };
  return new Promise((resolve, reject) => {
    download(url, options, function(err) {
      if (err) reject(err);
      resolve();
    });
  });
};
const getFileType = sourceFilePath => {
  return new Promise((resolve, reject) => {
    const magic = new Magic();
    magic.detectFile(sourceFilePath, function(err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const addWatermark = optionsImageWatermark => {
  return new Promise((resolve /*, reject*/) => {
    watermark.embed(optionsImageWatermark, function(/*status*/) {
      resolve();
    });
  });
};

class DrmService {
  constructor(app) {
    this.app = app;
  }
  async get(resourceId /*, obj*/) {
    new Promise(async resolve => {
      const sourceFolderPath =
        absoluteLocalStoragePath + '\\files\\' + resourceId;
      const ResourceFileList = await getResourceFileList(this.app, resourceId);
      await Promise.all(
        ResourceFileList.map(data => {
          return downloadFile(data.path, data.id, sourceFolderPath);
        })
      );
      await ep.open();
      await Promise.all(
        ResourceFileList.map(async element => {
          element.sourceFilePath = sourceFolderPath + '\\' + element.id;
          element.outputFilePath =
            sourceFolderPath + '\\' + element.id + '_out'; //It is sometimes not possible to override the original file
          element.remove = true; // While true the downloaded file is removed from disc at the end
          element.upload = false; // If there are files changed that have to be uploaded set this to true

          let fileType = await getFileType(element.sourceFilePath);
          fileType = fileType.split(' ')[0];
          if (['JPEG', 'PNG'].includes(fileType)) {
            element.upload = true;
            // obtain the size of an image
            const sourceFileSize = await getImageSize(element.sourceFilePath);
            const logoFileSize = await getImageSize(logoFilePath);

            let optionsImageWatermark = {
              type: 'image',
              source: element.sourceFilePath,
              logo: logoFilePath,
              destination: element.outputFilePath,
              position: {
                //Place Logo in center with 1/3 of original size of source Picture
                logoX: Math.round(
                  sourceFileSize.width / 2 - sourceFileSize.width / 3 / 2
                ),
                logoY: Math.round(
                  sourceFileSize.height / 2 -
                    (logoFileSize.height *
                      (sourceFileSize.width / 3 / logoFileSize.width)) /
                      2
                ),
                logoHeight: Math.round(
                  logoFileSize.height *
                    (sourceFileSize.width / 3 / logoFileSize.width)
                ),
                logoWidth: Math.round(sourceFileSize.width / 3)
              }
            };

            await addWatermark(optionsImageWatermark);
            await writeExifData(testDataToWrite, element.outputFilePath);
          } else if (['PDF'].includes(fileType)) {
            element.upload = true;
            const options = {
              keyLength: 256,
              password: {
                user: '',
                owner: 'MySuperSecretPassword'
              },
              outputFile: element.outputFilePath,
              restrictions: {
                print: 'none',
                modify: 'none',
                extract: 'n'
              }
            };

            await qpdf.encrypt(element.sourceFilePath, options);
            await writeExifData(testDataToWrite, element.outputFilePath);
          } else if (['Matroska'].includes(fileType)) {
            let fileName = element.path.split('/');
            fileName = fileName[fileName.length - 1];
            element.remove = false;
            mv(
              element.sourceFilePath,
              element.sourceFilePath + '_folder' + '\\' + fileName,
              { mkdirp: true },
              async error => {
                if (error != undefined) {
                  throw error;
                }
                await axios
                  .get(
                    'http://localhost:3000/api/queue/add/' +
                      fileName +
                      '?folderName=' +
                      resourceId +
                      '\\' +
                      element.id +
                      '_folder'
                  )
                  .then(async id => {
                    await axios
                      .get('http://localhost:3000/api/status/' + id.data)
                      .then(response => {
                        this.app.service('videoId').create({
                          videoId: response.data.id,
                          flow_id: response.data.queue_id,
                          fileId: element.id
                        });
                      });
                  })
                  .catch(error => {
                    throw error;
                  });
              }
            );
          }
        })
      );
      //Do things that have to be applied to every File in the Folder here
      //                    --->   <----
      await ep.close();
      //upload and delete Files
      await Promise.all(
        ResourceFileList.map(async element => {
          if (element.upload) {
            let sourceStream = fs.createReadStream(element.outputFilePath);
            await promisePipe(sourceStream, getUploadStream(element.id));
          }

          if (element.remove) {
            fs.unlinkSync(element.sourceFilePath);
            fs.unlinkSync(element.outputFilePath);
          }
        })
      );
      const isEmpty = emptyDir.sync(sourceFolderPath);
      if (isEmpty) {
        fs.rmdir(sourceFolderPath, err => {
          logger.error(err);
        });
      }
      return resolve();
    });
    return 'Done';
  }
}

module.exports = {
  DrmService
};
