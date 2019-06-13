const config = require('config');
const drmConfig = config.get('DRM');
const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const logger = require('winston');
const { restoreOriginalFiles } = require('./drmHelpers/drm_restoreFile.js');
const { createWatermark, getLogoFilePath, watermarkHasChanged} = require('./drmHelpers/drm_picture.js');
const { createPdfDrm } = require('./drmHelpers/drm_pdf.js');
const { createVideoDrm } = require('./drmHelpers/drm_video.js');
const { writeExifData } = require('./drmHelpers/drm_exifInfo.js');
const { writeDrmMetaDataToDB, writeDrmFileDataToDB } = require('./drmHelpers/drm_dbHelpers.js');
const { uploadAndDelete, getResourceFileList, downloadFile, getFileType } = require('./drmHelpers/handelFiles.js');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);

const isRestoreFile = (filePath) => {
  filePath = filePath.split('/');
  if (filePath[1] == drmConfig.originalFilesFolderName) {
    return true;
  }
  return false;
};


class DrmService {
  constructor(app) {
    this.app = app;
  }

  async get({resourceId, drmOptions, oldDrmOptions, isProtected} /*, obj*/) {
    new Promise(async resolve => {
      if (isProtected === true) {

        if (oldDrmOptions !== undefined) {
          if (!drmOptions.watermark && oldDrmOptions.watermark) {
            restoreOriginalFiles(this.app,resourceId, drmConfig.imageFileTypes);
          } if (!drmOptions.pdfIsProtected && oldDrmOptions.pdfIsProtected) {
            restoreOriginalFiles(this.app,resourceId, drmConfig.documentFileTypes);          
          } if (!drmOptions.videoIsProtected && oldDrmOptions.videoIsProtected) {
            restoreOriginalFiles(this.app,resourceId, drmConfig.videoFileTypes);
          }

          if (drmOptions.watermark && watermarkHasChanged(drmOptions, oldDrmOptions)) {
            await restoreOriginalFiles(this.app ,resourceId, drmConfig.imageFileTypes);
          }
        }

        const sourceFolderPath =
        drmConfig.absoluteLocalStoragePath + '\\'+drmConfig.downloadDir+'\\' + resourceId;
        const resourceFileList = await getResourceFileList(this.app, resourceId);
        await downloadFile(this.app, resourceFileList, sourceFolderPath);
        try {
          await ep.open();
        } catch (error) {
          logger.error(error);
        }
        let logoFilePath;
        if (drmOptions.watermark) {
          logoFilePath = await getLogoFilePath(this.app, drmOptions, resourceId, sourceFolderPath);
        }
  
        await Promise.all(
          resourceFileList.map(async element => {
            
            if (element.drmProtection === false) {
              element.sourceFilePath = sourceFolderPath + '\\' + element.id;
              element.outputFilePath =
                sourceFolderPath + '\\' + element.id + '_out'; //It is sometimes not possible to override the original file
              element.remove = true; // While true the downloaded file is removed from disc at the end
              element.upload = false; // If there are files changed that have to be reuploaded set this to true
  
              let fileType = await getFileType(element.sourceFilePath);
              fileType = fileType.split(' ')[0];
              if (!isRestoreFile(element.path)) {
                if (['JPEG', 'PNG'].includes(fileType) && drmOptions.watermark && logoFilePath != element.sourceFilePath) {
                  await createWatermark(element, logoFilePath, drmOptions);
                  await writeExifData(ep, drmOptions.exif, element.outputFilePath);
                  writeDrmFileDataToDB(this.app, element);
                } else if (['PDF'].includes(fileType)&&drmOptions.pdfIsProtected) {
                  await createPdfDrm(element);
                  await writeExifData(ep, drmOptions.exif, element.outputFilePath);
                  writeDrmFileDataToDB(this.app, element);
                } else if (['Matroska'].includes(fileType)&&drmOptions.videoIsProtected) {
                  createVideoDrm(this.app, element, resourceId);
                  writeDrmFileDataToDB(this.app, element);
                }
              }
            }
          })
        );
  
        /* ###################################################################
        # Do things that have to be applied to every downloaded File here
        ###################################################################### */
        await ep.close();
        writeDrmMetaDataToDB(this.app, resourceId, drmOptions);
        
        //upload and delete Files
        uploadAndDelete(this.app, resourceFileList, sourceFolderPath);
        return resolve();
      } else if(isProtected === false){
        restoreOriginalFiles(this.app,resourceId);
        this.app.service('resources').patch(resourceId, { drmOptions: {} });
        return resolve();
      }
     
    });
    return 'Done';
  }
}

module.exports = {
  DrmService
};
