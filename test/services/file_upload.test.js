const assert = require('assert');
const app = require('../../src/app');
const contentFilepaths = app.service('content_filepaths');

const request = require('request');
const fs = require('fs');

const PORT = 3031;
const content_mock_id = 'content_mock_id';

const { startS3MockServer, stopS3MockServer } = require('./s3mock');

describe('\'files/upload\' service', () => {
  it('registered the service', () => {
    const service = app.service('files/upload');

    assert.ok(service, 'Registered the service');
  });

  before(() => {
    return startS3MockServer().then(()=>{
      this.server = app.listen(PORT);
      return new Promise((resolve) => {
        this.server.once('listening', resolve);
      });
    });
  });


  after(() => {
    return stopS3MockServer().then(()=>{
      const closeServer = new Promise((resolve) => {
        this.server.close(resolve);
      });
      const cleanupFilepaths = contentFilepaths
        .find({ query: { contentId: content_mock_id } })
        .then(res => {
          return Promise.all(
            res.data.map(mockData => contentFilepaths.remove(mockData._id))
          );
        });
      return Promise.all([closeServer, cleanupFilepaths]);
    });
  });


  it('returns fileId', () => {

    return new Promise((resolve, reject) => {

      const mockFilename = 'test.txt';

      const req = request({
        headers: {
          'Authorization': 'Basic c2NodWxjbG91ZC1jb250ZW50LTE6Y29udGVudC0x',
        },
        uri: `http://localhost:${PORT}/files/upload?path=///${mockFilename}&contentId=${content_mock_id}`,
        method: 'POST'
      }, (err, resp, body) => {
        if (err || resp.statusCode < 200 || resp.statusCode >= 300) {
          return reject('Server returned error' + JSON.stringify(body, null, 2));
        } else {
          body = JSON.parse(body);
          assert.equal(body.status, 200);
          assert.ok(!!body.message.length);
          return resolve();
        }
      });
      var form = req.form();
      form.append('file', fs.createReadStream(__filename));
    });
  });
});
