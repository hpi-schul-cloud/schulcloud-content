const logger = require('winston');
const config = require('config');

class RedirectService {
  constructor(app) {
    this.app = app;
  }

  async get(id) {
    /*
    return this.app
      .service('resources')
      .get(id)
      .then(resource => {
        return this.app
          .service('resources')
          .patch(id, { clickCount: resource.clickCount + 1 });
      })
      .then(resource => {
        return resource.fullUrl;
      });
    */

    // Increase Click Counter
     const videoUrl = await this.app.service('/drm/videoRedirect').get(id).then((response) => {
			if (response) {
				return 'http://localhost:8080/video?recouceId='+id+'&videoId='+response;
			}
			return undefined;
    });
    if (videoUrl != undefined) {
      return videoUrl;
    }

    try {
      this.app
      .service('resources')
      .patch(id, {
        $inc: {
          clickCount: 1
        }
      });
    } catch (error) {
      logger.error(error);
    }
    return this.app
      .service('resources')
      .get(id)
      .then(resource => {
        return `${config.get('protocol')}://${config.get('host')}:${config.get(
          'port'
        )}/files/get/${resource._id.toString()}${resource.url}`;
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
