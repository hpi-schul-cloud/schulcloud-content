const logger = require('winston');
const request = require('request');
const hooks = require('./thumbnail.hooks');




class ThumbnailService {
  constructor(app) {
    this.app = app;
  }

  async patch(resourceId, data, params) {
    const resource = await this.app.service('resources').get(resourceId);



    const newReq2 = request({
      uri: 'http://localhost',
      method: 'POST'
    });
    newReq2.query = { path: 'UPLOAD'};
    var form = newReq2.form();
    form.append('file', request('http://127.0.0.1:3000/thumbnail?file='+resource.url));



/*
    const newReq = params.req;
    newReq.query = { path: 'UPLOAD'};
    const form = newReq.form();
    form.append('file', request('http://127.0.0.1:3000/thumbnail?file='+resource.url));
*/
    this.app.service('files/upload').create({}, { req: newReq2 });
  }
}

module.exports = function () {
  const app = this;

  // Initialize our service with any options it requires
  app.use('/thumbnail', new ThumbnailService(app));
  const service = app.service('thumbnail');
  //service.hooks(hooks);
};
