const config = require('config');
const drmConfig = config.get('DRM');
const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const { createWatermark } = require('./drmHelpers/drm_picture.js');
const { createPdfDrm } = require('./drmHelpers/drm_pdf.js');
const { createVideoDrm } = require('./drmHelpers/drm_video.js');
const { writeExifData } = require('./drmHelpers/drm_exifInfo.js');
const { uploadAndDelete, getResourceFileList, downloadFile, getFileType } = require('./drmHelpers/handelFiles.js');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);


// TODO Get logoFilePath, testDataToWrite from Frontend
const logoFilePath = 'C:\\Users\\admin\\MyStuff\\UNI\\BP\\temp\\c.png';

const testDataToWrite = {
  all: '', // remove existing tags
  comment: 'Exiftool rules!',
  'Keywords+': ['TestKeyWordNr1', 'TestKeyWordNr2'],
  CreatorAddress: 'test Address',
  CreatorWorkEmail: 'test-mail@test.de',
  CreatorWorkURL: 'test.me',
  ModelAge: '18',
  Nickname: 'testNick',
  Description: 'TestDescription',
  Creator: 'TestCreator'
};

class DrmService {
  constructor(app) {
    this.app = app;
  }

  async get(resourceId /*, obj*/) {
    new Promise(async resolve => {
      
      const sourceFolderPath =
      drmConfig.absoluteLocalStoragePath + '\\'+drmConfig.downloadDir+'\\' + resourceId;
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
          element.upload = false; // If there are files changed that have to be reuploaded set this to true

          let fileType = await getFileType(element.sourceFilePath);
          fileType = fileType.split(' ')[0];
          if (['JPEG', 'PNG'].includes(fileType)) {
            await createWatermark(element, logoFilePath);
            await writeExifData(ep, testDataToWrite, element.outputFilePath);
          } else if (['PDF'].includes(fileType)) {
            await createPdfDrm(element);
            await writeExifData(ep, testDataToWrite, element.outputFilePath);
          } else if (['Matroska'].includes(fileType)) {
            createVideoDrm(this.app, element, resourceId);
          }

        })
      );

      /* ###################################################################
      # Do things that have to be applied to every downloaded File here
      ###################################################################### */
      await ep.close();

      //upload and delete Files
      uploadAndDelete(ResourceFileList, sourceFolderPath);
      return resolve();
    });
    return 'Done';
  }
}

module.exports = {
  DrmService
};
