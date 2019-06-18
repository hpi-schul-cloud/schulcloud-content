const assert = require('assert');
const app = require('../../src/app');
const { WritableMock } = require('stream-mock');

const { mockUserId, mockProviderId } = require('./mockData');
const { uploadMockFile, PORT } = require('./file_upload.test');

let mockResourceId;
let mockFilePath;

const fs = require('fs');
const { startS3MockServer, stopS3MockServer } = require('./s3mock');

const insertMock = () => {
  const mockResourceData = {
    originId: Date.now().toString(),
    providerId: mockProviderId,
    url: 'https://de.khanacademy.org/video/number-grid',
    title: 'Testinhalt',
    description: 'Testinhalt',
    contentCategory: 'atomic',
    mimeType: 'application',
    userId: mockUserId,
    licenses: ['CC BY-SA'],
    tags: ['Test'],
    isPublished: true
  };

  return app.service('resources').create(mockResourceData).then(resourceObj => {
    mockResourceId = resourceObj._id.toString();
  });
};

const removeMock = () => {
  return app.service('resources').remove(mockResourceId);
};

describe('\'files/get*\' service', () => {
  before(() => {
    return insertMock()
      .then(() => {
        return startS3MockServer();
      })
      .then(() => {
        this.server = app.listen(PORT);
        return new Promise(resolve => {
          this.server.once('listening', resolve);
        });
      })
      .then(() =>
        uploadMockFile({
          filename: 'test.txt',
          filepath: __filename
        })
      )
      .then(({ body }) => {
        const { message: fileId } = JSON.parse(body);
        return app.service('resource_filepaths').patch(fileId, { resourceId: mockResourceId, isTemp: false });
      })
      .then(fileObj => {
        mockFilePath = fileObj.path;
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
        throw err;
      });
  });

  after(() => {
    return removeMock()
      .then(() => {
        return stopS3MockServer();
      })
      .then(
        () =>
          new Promise(resolve => {
            this.server.close(resolve);
          })
      )
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  });

  it('registered the service', () => {
    const service = app.service('files/get*');

    assert.ok(service, 'Registered the service');
  });

  it('returns file', () => {
    const service = app.service('files/get*');
    const expectedResult = fs.readFileSync(__filename, 'utf8');

    const resStream = new WritableMock({ objectMode: true });

    return new Promise((resolve, reject) => {
      resStream.on('finish', () => {
        assert.equal(
          JSON.stringify(resStream.data.join('')),
          JSON.stringify(expectedResult)
        );
        resolve();
      });
      resStream.on('error', reject);
      service
        .find({
          req: {
            params: {
              '0': mockResourceId + '/' + mockFilePath
            },
            res: resStream,
            headers: {
              Authorization: 'Basic b2xpdmVAZXhhbXBsZS5jb206dHJlZQ=='
            }
          },
          query: {
            userId: mockUserId
          },
          route: [mockFilePath]
        })
        .catch(reject);
    });
  });
});
