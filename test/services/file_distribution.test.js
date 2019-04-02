const assert = require('assert');
const app = require('../../src/app');
const { WritableMock } = require('stream-mock');
const resources = app.service('resources');
const resourceFilepaths = app.service('resource_filepaths');

const { mockUserId } = require('./mockData');

let mockResourceId;
let mockFileId;

const fs = require('fs');
const path = require('path');
const { startS3MockServer, stopS3MockServer, serverDirectory, container } = require('./s3mock');
const ncp = require('ncp').ncp;
const source = path.resolve('test/mockData/test_txt');

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
      mockResourceId = resourceObj._id;

      const mockFileData = {
        path: `${mockResourceId}/test.txt`,
        resourceId: mockResourceId,
        isTemp: false,
        createdBy: mockUserId
      };
      return resourceFilepaths.create(mockFileData);
    })
    .then(fileObj => {
      mockFileId = fileObj._id;
    });
};

const removeMock = () => {
  return resources.remove(mockResourceId)
    .then(() => resourceFilepaths.remove(mockFileId));

};

describe('\'files/get*\' service', () => {

  before(function() {
    return insertMock()
      .then(() => startS3MockServer())
      .then(() => {
        return new Promise((resolve, reject) => {
          const destination = path.resolve(`${serverDirectory}/${container}/${mockFileId}`);
          ncp(source, destination, (err) => {
            if (err) {
              return reject();
            }
            resolve();
          });
        });
      }).catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  });

   after(function() {
    return removeMock().then(() => {
      return stopS3MockServer();
    }).catch(err => {
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
    const expectedResult = fs.readFileSync(source + '/.dummys3_content', 'utf8');

    const resStream = new WritableMock({objectMode: true});

    return new Promise((resolve, reject) => {
      resStream.on('finish', ()=>{
        assert.equal(JSON.stringify(resStream.data.join('')), JSON.stringify(expectedResult));
        resolve();
      });
      resStream.on('error', reject);
      const mockFilePath = `${mockResourceId}/test.txt`;
      service.find({req: {params: {'0':mockFilePath}, res: resStream}, route: [mockFilePath]}).catch(reject);
    });
  });
});
