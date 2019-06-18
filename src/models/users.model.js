// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const users = new mongooseClient.Schema({

    username: { type: String, unique: true },
    password: { type: String },
    email: { type: String, unique: true, lowercase: true },
    forename: { type: String },
    familyname: { type: String },
    providerId: { type: mongooseClient.Types.ObjectId, ref: 'provider' },
    role: { type: String, enum : ['user', 'admin', 'superhero'], default: 'user' },

  }, {
    timestamps: true
  });

  return mongooseClient.model('users', users);
};