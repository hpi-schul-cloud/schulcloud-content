const writeExifData = async (ep, data, path) => {
  if(Object.keys(data).length === 0){
    return;
  }
  await ep.writeMetadata(path, data, ['-File:all', 'overwrite_original']);
  return;
};

module.exports = {
  writeExifData
};
