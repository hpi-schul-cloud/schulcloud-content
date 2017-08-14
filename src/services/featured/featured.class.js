class Service {

  constructor (options) {
    this.options = options || {};
  }

  find (params) {
    let featuredContent = ['5975f999cdcc20002234d363', '5975f999cdcc20002234d364', '5975f999cdcc20002234d367', '5975f99ccdcc20002234d79f', '5975f99ccdcc20002234d7a2', '5975f99ccdcc20002234d7a1'];
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
