// content-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const proposal = new mongooseClient.Schema({

    userId: { type: mongooseClient.Schema.Types.ObjectId, required: true },
    ratings: [ mongooseClient.Schema.Types.Mixed ],
    categories: { type: mongooseClient.Schema.Types.Mixed, required: true },
    approvalCount: { type: Number, default: 0 },
    content: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

  });

  return mongooseClient.model('proposal', proposal);
};

// // Rating Schema:
// {
//   type:
//     {
//       userId: {type: mongooseClient.Schema.Types.ObjectId, required: true },
//       text: {type: Number, required: true, default: 0 },
//       layout: {type: Number, required: true, default: 0 },
//       overall: {type: Number, required: true, default: 0 },
//       message: {type: String, required: true }
//     },
//     required: true
// },
