'use strict';

const { FileStructureService } = require('./file_structure.service.js');
const { FileDistributionService } = require('./file_distribution.service.js');
const { FileUploadService } = require('./file_upload.service.js');
const { FileManageService } = require('./file_manage.service.js');

const hooks = require('./file.hooks');

module.exports = function() {
  const app = this;

  /* ##################################################
  # UPLOAD
  # Usage: POST /files/upload/
  #   with multipart/form-data as body
  # Result: fileId of stored File
  ################################################## */

  app.use('/files/upload', new FileUploadService(app));
  // Get our initialize service to that we can bind hooks
  const fileUploadService = app.service('files/upload');
  fileUploadService.hooks(hooks.upload);



  /* ##################################################
  # PERSIST
  # Usage: For internal use only, see "resource"-hooks
  # Result: fileId of stored File
  ################################################## */

  app.use('/files/manage', new FileManageService(app));
  const fileManageService = app.service('files/manage');
  fileManageService.hooks(hooks.manage);



  /* ##################################################
  # DOWNLOAD
  # Usage: GET /files/get/{filepath at storage location}
  # Result: stored file
  ################################################## */

  app.use('/files/get*', new FileDistributionService(app));
  const fileDistributionService = app.service('files/get*');
  fileDistributionService.hooks(hooks.distribution);



  /* ##################################################
  # FILETREE
  # Usage: GET /files/structure/{resourceId}
  #   add ?temp=true to get current temp files
  # Result: Filetree of uploaded files
  ################################################## */

  app.use('/files/structure', new FileStructureService(app));
  const fileStructureService = app.service('files/structure');
  fileStructureService.hooks(hooks.structure);
};
