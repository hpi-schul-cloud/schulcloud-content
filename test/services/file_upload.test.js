const assert = require('assert');
const app = require('../../src/app');
const contentFilepaths = app.service('resource_filepaths');

const request = require('request');
const fs = require('fs');

const PORT = 3031;

const {mockResourceId} = require("./mockData");

const { startS3MockServer, stopS3MockServer } = require('./s3mock');

const uploadMockFile = ({filepath, filename, resourceId }) => {
  return new Promise((resolve, reject) => {
    const req = request({
      headers: {
        'Authorization': 'Basic dG9pQGV4YW1wbGUuY29tOnN0b3J5',
      },
      uri: `http://localhost:${PORT}/files/upload?path=///${filename}&resourceId=${resourceId}`,
      method: 'POST'
    }, (err, resp) => {
      if (err || resp.statusCode < 200 || resp.statusCode >= 300) {
        return reject(err || resp.toJSON());
      } else {
        return resolve(resp);
      }
    });
    var form = req.form();
    form.append('file', fs.createReadStream(filepath));
  });
};

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
        .find({ query: { resourceId: mockResourceId } })
        .then(res => {
          return Promise.all(
            res.data.map(mockData => contentFilepaths.remove(mockData._id))
          );
        });
      return Promise.all([closeServer, cleanupFilepaths]);
    });
  });


  it('returns fileId', () => {
    return uploadMockFile({
        filename: 'test.txt',
        filepath: __filename,
        resourceId: mockResourceId,
      })
      .then(({ body }) => {
        body = JSON.parse(body);
        assert.equal(body.status, 200);
        assert.ok(!!body.message.length); // was an id returned?
      });
  });
});

module.exports = {
  PORT,
  uploadMockFile
};