// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.


module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');

    const resource_filepaths = new mongooseClient.Schema({
      // _id = fileId as used in StorageServer
      path: {type: String, required: true}, // "/resourceId/folderA/fileB.txt",
      resourceId: {type: String},
      createdBy: {type: String, required: false}, // TODO FIX
      isTemp: {type: Boolean, required: true},

      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },{
      timestamps: true
    });

    return mongooseClient.model('resource_filepaths', resource_filepaths);
  };