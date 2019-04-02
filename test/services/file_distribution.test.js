const assert = require('assert');
const app = require('../../src/app');
const { WritableMock } = require('stream-mock');
const resources = app.service('resources');
const resourceFilepaths = app.service('resource_filepaths');

const { mockUserId } = require('./mockData');
const { uploadMockFile, PORT } = require('./file_upload.test');

let mockResourceId;
let mockFilePath;

const fs = require('fs');
const { startS3MockServer, stopS3MockServer } = require('./s3mock');

const insertMock = () => {
  const mockResourceData = {
    'originId' : Date.now().toString(),
    'providerName' : 'Test',
    'url' : 'https://de.khanacademy.org/video/number-grid',
    'title' : 'Testinhalt',
    'description' : 'Testinhalt',
    'contentCategory' : 'atomic',
    'mimeType' : 'application',
    'userId' : mockUserId,
    'licenses' : [ 'CC BY-SA' ],
    'tags' : [ 'Test' ],
    isPublished: true
  };

  return resources.create(mockResourceData)
    .then(resourceObj => {
      mockResourceId = resourceObj._id.toString();
    });
};

const removeMock = () => {
  return resources.remove(mockResourceId);
};

describe('\'files/get*\' service', () => {

  before(() => {
    return insertMock()
      .then(() => {
        return startS3MockServer();
      })
      .then(() => {
        this.server = app.listen(PORT);
        return new Promise((resolve) => {
          this.server.once('listening', resolve);
        });
      })
      .then(() => uploadMockFile({
          filename: 'test.txt',
          filepath: __filename,
          resourceId: mockResourceId,
        }))
      .then(({ body }) => {
        const {message: fileId} = JSON.parse(body);
        return resourceFilepaths.patch(fileId, { isTemp: false });
      })
      .then((fileObj) => {
        mockFilePath = fileObj.path;
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  });

   after(() => {
    return removeMock()
      .then(() => {
        return stopS3MockServer();
      })
      .then(() => new Promise((resolve) => {
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

    const resStream = new WritableMock({objectMode: true});

    return new Promise((resolve, reject) => {
      resStream.on('finish', ()=>{
        assert.equal(JSON.stringify(resStream.data.join('')), JSON.stringify(expectedResult));
        resolve();
      });
      resStream.on('error', reject);
      service.find({
        req: {
          params: {
            '0':mockFilePath
          },
          res: resStream,
          headers: {
            'Authorization': 'Basic c2NodWxjbG91ZC1jb250ZW50LTE6Y29udGVudC0x',
          }
        },
        query: {
          userId: mockUserId
        },
        route: [mockFilePath]
      }).catch(reject);
    });
  });
});
