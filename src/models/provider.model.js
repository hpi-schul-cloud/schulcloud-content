module.exports = function (app) {
    const mongooseClient = app.get('mongooseClient');
    const provider = new mongooseClient.Schema({

      name: { type: String, unique: true },

    }, {
      timestamps: true
    });

    return mongooseClient.model('provider', provider);
  };