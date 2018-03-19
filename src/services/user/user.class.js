class UserService {

  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  find (params) {
    // call another service here with params
    if (!params) { Promise.reject([]); }
    const service = this.app.service('resources');
    // the authenticate hook will populate the userID in the params just in that case
    const data = service.find({query: params.query});
    return Promise.resolve(data);

  }
}

module.exports = function (options) {
  return new UserService(options);
};

module.exports.Service = UserService;
