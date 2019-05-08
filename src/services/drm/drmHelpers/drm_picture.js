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

const createWatermark = async (element, logoFilePath) => {
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
        logoFileSize.height * (sourceFileSize.width / 3 / logoFileSize.width)
      ),
      logoWidth: Math.round(sourceFileSize.width / 3)
    }
  };

  await addWatermark(optionsImageWatermark);
};

module.exports = {
  createWatermark
};
