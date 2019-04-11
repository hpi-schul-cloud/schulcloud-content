const logger = require('winston');
var qpdf = require('node-qpdf');
var watermark = require('dynamic-watermark');
const gm = require('gm');
var fs = require('fs');
var download = require('download-file');
const config = require('config');
var Magic = require('mmmagic').Magic;
const {
  promisePipe,
  getUploadStream
} = require('./storageHelper.js');


const logoFilePath = 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\temp\\c.png';
const absoluteLocalStoragePath = 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\schulcloud-content\\localStorage\\files';
const localStoragePath = 'localStorage/files/';

function getImageSize(localFilePath) {
  return new Promise((resolve, reject) => {
    gm(localFilePath)
  .size(async function (err, size) {
    if (!err) {
      size = {
        width: size.width,
        height: size.height
      };
      resolve(size);
    }else{
      reject(undefined);
    }
  });
 });
}

const getResourceFileList = (app, resourceId) =>{
  const getFilePathPromise = app.service('resource_filepaths').find({ query: {
    resourceId: resourceId
  }})
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

const downloadFile = (path,name) => {
  let preUrl = `${config.get('protocol')}://${config.get('host')}:${config.get('port')}/files/get`;
  var url = preUrl + path;
 
  var options = {
      directory: localStoragePath,
      filename: name
  };
  return new Promise((resolve, reject) => {
    download(url, options, function(err){
      if (err) reject(err);
      resolve();
    });
  });
};
const getFileType = (sourceFilePath) => {
  return new Promise((resolve, reject) => {
    var magic = new Magic();
      magic.detectFile(sourceFilePath, function(err, result) {
        if (err) reject(err);
        resolve(result);
    });
  });
};

const addWatermark = (optionsImageWatermark) =>{
  return new Promise((resolve, reject) => {
    watermark.embed(optionsImageWatermark, function(status) {
      resolve();
    }); 
  });  
};



class DrmService {
  constructor(app) {
    this.app = app;
  }
  async get(resourceId, obj/*{ query: queryParams }*/) {

    const ResourceFileList = await getResourceFileList(this.app, resourceId);
    await Promise.all(ResourceFileList.map((data) => {
      return downloadFile(data.path, data.id);
    } 
    ));

  await Promise.all(ResourceFileList.map(async (element) => {
    const sourceFilePath = absoluteLocalStoragePath+'\\'+element.id;
    const outputFilePath = absoluteLocalStoragePath+'\\'+element.id;
    let fileType = await getFileType(sourceFilePath);
    fileType = fileType.split(' ')[0];
    if (['JPEG','PNG'].includes(fileType)) {
      // obtain the size of an image
      const sourceFileSize = await getImageSize(sourceFilePath);
      const logoFileSize = await getImageSize(logoFilePath);
    
      let optionsImageWatermark = {
        type: 'image',
        source: sourceFilePath,
        logo: logoFilePath,
        destination: outputFilePath,
        position: {
            //Place Logo in center with 1/3 of original size of source Picture
            logoX : Math.round((sourceFileSize.width/2)-((sourceFileSize.width/3)/2)),
            logoY : Math.round((sourceFileSize.height/2)-((logoFileSize.height*((sourceFileSize.width/3)/logoFileSize.width))/2)),
            logoHeight: Math.round(logoFileSize.height*((sourceFileSize.width/3)/logoFileSize.width)),
            logoWidth: Math.round(sourceFileSize.width/3)
        }
      };
      await addWatermark(optionsImageWatermark);
      let sourceStream = fs.createReadStream(sourceFilePath);
      await promisePipe(sourceStream, getUploadStream(element.id));      
    }else if (['PDF'].includes(fileType)) {
      const outputFilePath = absoluteLocalStoragePath+'\\out_'+element.id;
      const options = {
        keyLength: 256,
        password: {
          user: '',
          owner: 'MySuperSecretPassword'},
        outputFile: outputFilePath,
        restrictions: {
          print: 'none',
          modify: 'none',
          extract: 'n'
      }
    };
    await qpdf.encrypt(sourceFilePath, options);
    let sourceStream = fs.createReadStream(outputFilePath);
    await promisePipe(sourceStream, getUploadStream(element.id));
    fs.unlinkSync(outputFilePath);
    }
    // delete files
    fs.unlinkSync(sourceFilePath);
  }));
    return 'Done';
  }
}

module.exports = {
  DrmService
};
