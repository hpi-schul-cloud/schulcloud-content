// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.


module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');

    const videoId = new mongooseClient.Schema({
      videoId: {type: String, required: true},
      flow_id: {type: String},
      fileId: {type: String, required: true},

      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },{
      timestamps: true
    });

    return mongooseClient.model('videoId', videoId);
  };