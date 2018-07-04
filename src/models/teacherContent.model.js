// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const teacherContent = new mongooseClient.Schema({

    userId: { type: mongooseClient.Schema.Types.ObjectId, required: true },
    ratings: [ mongooseClient.Schema.Types.Mixed ],
    categories: { type: mongooseClient.Schema.Types.Mixed, required: true },
    content: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

  });

  return mongooseClient.model('teachercontent', teacherContent);
};
