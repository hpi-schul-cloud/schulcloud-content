//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.


module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');

  const access_token = new mongooseClient.Schema({
    // _id = is used as the token itself
    resourceId: {type: mongooseClient.Schema.Types.ObjectId, required: true },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },{
    timestamps: true
  });

  return mongooseClient.model('access_token', access_token);
};