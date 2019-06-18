const config = require('config');
const drmConfig = config.get('DRM');
const qpdf = require('node-qpdf');
var crypto = require('crypto');

const createPdfDrm = async element => {
  element.upload = true;
  const options = {
    keyLength: drmConfig.pdfConfig.keyLength,
    password: {
      user: '',
      owner: crypto.randomBytes(20).toString('hex') //TODO RANDOM
    },
    outputFile: element.outputFilePath,
    restrictions: {
      print: drmConfig.pdfConfig.print,
      modify: drmConfig.pdfConfig.modify,
      extract: drmConfig.pdfConfig.extract
    }
  };

  await qpdf.encrypt(element.sourceFilePath, options);
};

module.exports = {
  createPdfDrm
};
