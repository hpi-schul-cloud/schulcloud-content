const mongoose = require('mongoose');

module.exports = function(app) {
  const { host, port, database } = app.get('mongodb');
  const url = `mongodb://${host || 'localhost'}:${port || '27017'}/${database ||
    'schulcloud_content'}`;
  mongoose.connect(url, {
    useCreateIndex: true,
    useNewUrlParser: true
  });
  mongoose.Promise = global.Promise;

  app.set('mongooseClient', mongoose);
};
