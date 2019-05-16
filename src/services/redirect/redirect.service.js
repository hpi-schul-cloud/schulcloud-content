class RedirectService {
  constructor(app) {
    this.app = app;
  }

  get(id) {
    // Increase Click Counter
    return this.app
      .service('resources')
      .patch(id, {
        $inc: {
          clickCount: 1
        }
      })
      .then(resource => {
        return resource.fullUrl;
      });
  }

  static redirect(req, res) {
    res.redirect(res.data);
  }

  setup(app) {
    this.app = app;
  }
}

module.exports = function() {
  const app = this;

  app.use('/redirect', new RedirectService(), RedirectService.redirect);
};
