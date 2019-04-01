const assert = require('assert');
const app = require('../../src/app');
const { WritableMock } = require('stream-mock');
const contentFilepaths = app.service('resource_filepaths');

const { mockUserId, mockResourceId } = require('./mockData');

let mockFileId;

const fs = require('fs');
const path = require('path');
const { startS3MockServer, stopS3MockServer, serverDirectory, container } = require('./s3mock');
const ncp = require('ncp').ncp;
const source = path.resolve('test/mockData/test_txt');

const insertMock = () => {
  const mockData = {
    path: `${mockResourceId}/test.txt`,
    resourceId: mockResourceId,
    isTemp: false,
    createdBy: mockUserId
  };
  return contentFilepaths.create(mockData).then(fileObj => {
    mockFileId = fileObj._id;
  });
};

const removeMock = () => {
  return contentFilepaths.remove(mockFileId);
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
      });
  });

   after(function() {
    return removeMock().then(() => {
      return stopS3MockServer();
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
      service.find({req: {params: {'0':`${mockResourceId}/test.txt`}, res: resStream}}).catch(reject);
    });
  });
});
