// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const content = new mongooseClient.Schema({
    title: { type: String, required: true },
    // provider: { type: String, required: true },
    url: { type: String, required: true },
    licenses: { type: [String], required: true },
    contentCategory: { type: String, enum: ['atomic', 'learning-object',
      'proven-learning-object', 'tool'], required: true },
    mimeType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  return mongooseClient.model('content', content);
};
