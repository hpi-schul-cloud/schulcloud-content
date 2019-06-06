const writeDrmMetaDataToDB = (app, resourceId, drmOptions) => {
  app.service('resources').patch(resourceId, {drmOptions: drmOptions});
};
const writeDrmFileDataToDB = (app, element) => {
  app.service('resource_filepaths').patch(element.id.toString(),{drmProtection: true });
};

module.exports = {
  writeDrmMetaDataToDB,
  writeDrmFileDataToDB
};
