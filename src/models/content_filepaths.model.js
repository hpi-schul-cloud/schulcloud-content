// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.


/*
Bei Upload:
File ID erstellen: 
Created by: User id
content ID
tempFlag boolean

*/
module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');

    const content_filepaths = new mongooseClient.Schema({
      fileIds: {type: Array, required: true }, //Array of Strings [PFAD/file,PFAD2/file2,...]
      contentId: {type: String, required: true},
      userId: {type: String, required: true},
      isTemporary: {type: Boolean, required: true},
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    });

    return mongooseClient.model('content_filepaths', content_filepaths);
  };