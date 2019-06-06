const gm = require('gm');
const watermark = require('dynamic-watermark');

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

const addWatermark = optionsImageWatermark => {
  return new Promise((resolve /*, reject*/) => {
    watermark.embed(optionsImageWatermark, function(/*status*/) {
      resolve();
    });
  });
};

const createWatermark = async (element, logoFilePath, drmOptions) => {
  const watermarkBoxSize = drmOptions.watermarkBoxSize || 50; //TODO do this in Frontend instead
  const xWatermarkPosition = drmOptions.xWatermarkPosition || 50;
  const yWatermarkPosition = drmOptions.yWatermarkPosition || 50;
  element.upload = true;
  // obtain the size of an image
  const sourceFileSize = await getImageSize(element.sourceFilePath);
  const logoFileSize = await getImageSize(logoFilePath);
  
  let logoWidth = sourceFileSize.width * watermarkBoxSize / 100;
  let logoHeight = logoFileSize.height * (logoWidth/logoFileSize.width);
  if (logoHeight > sourceFileSize.height && drmOptions.watermarkExceedFrame){
    logoHeight = sourceFileSize.height * watermarkBoxSize / 100;
    logoWidth = logoFileSize.width * (logoHeight/logoFileSize.height);
  }
  const logoX = (sourceFileSize.width - logoWidth) * xWatermarkPosition / 100;
  const logoY = (sourceFileSize.height - logoHeight) * yWatermarkPosition / 100;
  let optionsImageWatermark = {
    type: 'image',
    source: element.sourceFilePath,
    logo: logoFilePath,
    destination: element.outputFilePath,
    position: {
      logoX: Math.round(logoX),
      logoY: Math.round(logoY),
      logoHeight: Math.round(logoHeight),
      logoWidth: Math.round(logoWidth)
    }
  };

  await addWatermark(optionsImageWatermark);
};

const getLogoFilePath = async (app, drmOptions, resourceId, sourceFolderPath) => {
  return app.service('resource_filepaths').find({
    query: { resourceId: resourceId, path: drmOptions.watermarkImage }
  }).then(result => {
    return sourceFolderPath + '\\' + result.data[0]._id.toString();
  });
};

module.exports = {
  createWatermark,
  getLogoFilePath
};
