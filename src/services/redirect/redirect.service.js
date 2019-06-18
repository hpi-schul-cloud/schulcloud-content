const logger = require('winston');

class RedirectService {
  constructor(app) {
    this.app = app;
  }

  async get(id) {

    // if it is a protected video -> redirect to video player
     const videoUrl = await this.app.service('/drm/videoRedirect').get(id).then((response) => {
			if (response) {
				return 'http://localhost:8080/video?recouceId='+id+'&videoId='+response; //TODO get URL from config
			}
			return undefined;
    });
    if (videoUrl != undefined) {
      return videoUrl;
    }

    // try to increment clickCount
    try {
      await this.app
      .service('resources')
      .patch(id, {
        $inc: {
          clickCount: 1
        }
      });
      
    } catch (error) {
      logger.error(error);
    }

    // redirect to content
    return this.app.service('resources').get(id)
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
