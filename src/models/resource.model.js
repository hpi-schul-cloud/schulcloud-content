// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');

  const thumbnailOptionsSchema = new mongooseClient.Schema({
    generate: {type: boolean, 'default': false, required: true},
    options: {type: String, 'default': '', required:true}
  });

  const resource = new mongooseClient.Schema({

    originId: { type: String, unique: true },
    userId: {type: mongooseClient.Schema.Types.ObjectId, required: true },
    providerName: { type: String, required: true },

    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: {type: String },
    thumbnailOptions: thumbnailOptionsSchema,

    tags: { type: [String] },
    licenses: { type: [String], required: true },
    contentCategory: { type: String, enum: ['atomic', 'learning-object', 'proven-learning-object', 'tool'], required: true },
    mimeType: { type: String, required: true },

    promoUntil: { type: Date },
    featuredUntil: { type: Date },
    clickCount: { type: Number },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

  });

  return mongooseClient.model('resource', resource);
};
