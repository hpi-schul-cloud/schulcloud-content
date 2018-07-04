const mongoose = require('mongoose');

module.exports = function () {
  const app = this;

  mongoose.connect("mongodb://localhost:27017/schulcloud_content"); //app.get('mongodb')
  mongoose.Promise = global.Promise;

  app.set('mongooseClient', mongoose);
};
