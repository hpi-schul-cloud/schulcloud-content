const logger = require('winston');

const writeExifData = async (ep, data, path) => {
  if(data === undefined || Object.keys(data).length === 0){
    return;
  }try {
    await ep.writeMetadata(path, data, ['-File:all', 'overwrite_original']);
  } catch (error) {
    logger.error(error);
  }
  return;
};

module.exports = {
  writeExifData
};
