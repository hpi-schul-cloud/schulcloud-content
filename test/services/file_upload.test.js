const assert = require('assert');
const app = require('../../src/app');
const contentFilepaths = app.service('content_filepaths');

const request = require('request');
const fs = require('fs');

const PORT = 3031;
const content_mock_id = 'content_mock_id';

const S3rver = require('s3rver');
let instance;

const startS3MockServer = () => { 
  instance = new S3rver({
		port: 9001,
		hostname: 'localhost',
		silent: false,
		directory: './tmp'
	}).run((err, host, port) => {
		if(!err) {
			console.log(`local S3 is running on ${host}:${port}`);
		}
	});
};

describe('\'files/upload\' service', () => {
  it('registered the service', () => {
    const service = app.service('files/upload');

    assert.ok(service, 'Registered the service');
  });

  before((done) => {
    startS3MockServer();
    this.server = app.listen(PORT);
    this.server.once('listening', () => done());
  });

  after((done) => {
    instance.close();
    this.server.close(done);
    contentFilepaths
    .find({ query: { contentId: content_mock_id } })
    .then(res => {
      return Promise.all(
        res.data.map(mockData => contentFilepaths.remove(mockData._id))
      );
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
