const writeDrmMetaDataToDB = (app, resourceId, drmOptions) => {
  app.service('resources').patch(resourceId, {drmOptions: drmOptions});
};
const writeDrmFileDataToDB = (app, element) => {
  app.service('resource_filepaths').patch(element.id.toString(),{drmProtection: true });
};

const getFileName = (path) =>{
  let file = path.split('/');
  file = file[file.length - 1];
  return file;
};

const getFileExtension = (path) =>{
  const file = getFileName(path);
  let extension = file.split('.');
  extension = extension[extension.length - 1];
  return extension;
  
};

module.exports = {
  writeDrmMetaDataToDB,
  writeDrmFileDataToDB,
  getFileName,
  getFileExtension
};
