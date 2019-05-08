const writeExifData = async (ep, data, path) => {
  await ep.writeMetadata(path, data, ['-File:all', 'overwrite_original']);
};

module.exports = {
  writeExifData
};
