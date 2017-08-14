class Service {

  constructor (options) {
    this.options = options || {};
  }

  find (params) {
    let featuredContent = ['59919169c9df580090bc0815', '59919169c9df580090bc0816', '59919169c9df580090bc0817', '59919169c9df580090bc0819', '59919169c9df580090bc0818', '59919169c9df580090bc081a'];
    return this.options.app.service('content').find({
      query: {
        _id: {
          $in: featuredContent
        }
      },
      'req': params.req,
    }).then(item => Promise.resolve(item));
  }

}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
