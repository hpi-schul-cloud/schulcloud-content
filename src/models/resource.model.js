// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const resource = new mongooseClient.Schema({

    originId: { type: String }, // , unique: true , required: true --> not anymore with internal material (?)
    userId: {type: mongooseClient.Schema.Types.ObjectId, required: true },
    providerName: { type: String, required: true }, // Schul-Cloud for internal material

    url: { type: String }, // not required anymore since we are mixing internal and external contents
    content: { type: String }, // check with BP which format exactly, but probably a json string
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: {type: String },

    tags: { type: [String] },
    topics: { type: [String] },
    difficulty: { type: String, enum: ['Leicht', 'Mittel', 'Schwer', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] }, // required for intenal material
    goal: { type: String, enum: ['Einführung', 'Festigung', 'Wissenstransfer', 'Spaß'] }, // required for intenal material
    subjects: { type: [String] }, // required for intenal material, we could use an enum here and a "translation" file for the different states since subjects aren't called the same everywhere
    age: { type: Number },
    ageRange: { type: Number },

    licenses: { type: [String], required: true }, // default for internal material: CC BY-NC?
    contentCategory: { type: String, enum: ['atomic', 'learning-object', 'proven-learning-object', 'tool'], required: true }, // for internal material, this should default to ???
    mimeType: { type: String, required: true },

    ratings: { type: [ mongooseClient.Schema.Types.Mixed ] },
    approvalCount: { type: Number, default: 0},
    approved: { type: Boolean, default: false },
    isPrivat: { type: Boolean, default: true },

    promoUntil: { type: Date },
    featuredUntil: { type: Date },
    clickCount: { type: Number },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

  });

  return mongooseClient.model('resource', resource);
};
