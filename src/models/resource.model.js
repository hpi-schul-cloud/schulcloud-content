// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const resource = new mongooseClient.Schema({
    originId: { type: String },
    providerName: { type: String },
    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: {type: String },
    
    languages: { type: [String] },

    tags: { type: [String] },
    licenses: { type: [String], /*required: true*/ },
    contentCategory: { type: String, enum: ['a', 'l', 'rl', 't'], required: true },
    mimeType: { type: String, required: true },
  })
  const userResource = new mongooseClient.Schema({

    userId: {type: mongooseClient.Schema.Types.ObjectId, required: true },

    attributes: { type: resource , required: true},

    promoUntil: { type: Date },
    featuredUntil: { type: Date },
    clickCount: { type: Number },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

  });

  return mongooseClient.model('user-resource', userResource);
};
