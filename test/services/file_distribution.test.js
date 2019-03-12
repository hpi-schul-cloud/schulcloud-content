const assert = require('assert');
const app = require('../../src/app');
const { WritableMock } = require('stream-mock');
const contentFilepaths = app.service('content_filepaths');

const { mockUserId, mockContentId } = require('./mockData');

let mockFileId;

const path = require('path');
const { startS3MockServer, stopS3MockServer, serverDirectory, container } = require('./s3mock');
const ncp = require('ncp').ncp;
const source =  path.resolve('test/mockData/5c87ad3757fc628ed4a258e0');
const destination = path.resolve(`${serverDirectory}/${container}/5c87ad3757fc628ed4a258e0`);

const insertMock = () => {
  const mockData = {
    path: `${mockContentId}/test.txt`,
    contentId: mockContentId,
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
    const expectedResult = '{"test": true}';

    const resStream = new WritableMock({objectMode: true});

    return new Promise((resolve, reject) => {
      resStream.on('finish', ()=>{
        assert.equal(JSON.stringify(resStream.data.join('')), JSON.stringify(expectedResult));
        resolve();
      });
      resStream.on('error', reject);
      service.find({req: {params: {'0':`${mockContentId}/test.txt`}, res: resStream}}).catch(reject);
    });
  });
});
