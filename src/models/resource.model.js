// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');

  const resource = new mongooseClient.Schema({
    originId: { type: String, unique: true },
    userId: {type: mongooseClient.Schema.Types.ObjectId, required: true },
    providerName: { type: String, required: true },

    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: {type: String },

    tags: { type: [String] },
    licenses: { type: [String]},
    contentCategory: { type: String, enum: ['atomic', 'learning-object', 'proven-learning-object', 'tool'] },
    mimeType: { type: String },

    promoUntil: { type: Date },
    featuredUntil: { type: Date },
    clickCount: { type: Number },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    isPublished:{ type: Boolean, default: false }
  });

  return mongooseClient.model('resource', resource);
};
