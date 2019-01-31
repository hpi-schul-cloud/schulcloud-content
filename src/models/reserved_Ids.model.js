// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
  
    const reserved_Ids = new mongooseClient.Schema({
      userId: {type: mongooseClient.Schema.Types.ObjectId, required: true },

      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },  
    });
  
    return mongooseClient.model('reserved_Ids', reserved_Ids);
  };  