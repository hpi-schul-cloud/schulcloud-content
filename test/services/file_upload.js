const assert = require('assert');
const app = require('../../src/app');

const request = require('request');
const fs = require('fs');

const PORT = 3031;

describe('\'files/upload\' service', () => {
  it('registered the service', () => {
    const service = app.service('files/upload');

    assert.ok(service, 'Registered the service');
  });

  before(function(done) {
    this.server = app.listen(PORT);
    this.server.once('listening', () => done());
  });

  after(function(done) {
    this.server.close(done);
  });

  it('adds uploaded file to db', () => {

    return new Promise((resolve, reject) => {

      const mockFilename = 'test.txt';

      const req = request({
        headers: {
          'Authorization': 'Basic c2NodWxjbG91ZC1jb250ZW50LTE6Y29udGVudC0x',
        },
        uri: `http://localhost:${PORT}/files/upload?path=///${mockFilename}`,
        method: 'POST'
      }, (err, resp, body) => {
        if (err || resp.statusCode < 200 || resp.statusCode >= 300) {
          return reject('Server returned error' + JSON.stringify(body, null, 2));
        } else {
          assert.ok(JSON.parse(body).message.includes(mockFilename));
          return resolve();
        }
      });
      var form = req.form();
      form.append('file', fs.createReadStream(__filename));
    });
  });
});
