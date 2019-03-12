const assert = require('assert');
const app = require('../../src/app');
const { WritableMock } = require('stream-mock');
const contentFilepaths = app.service('content_filepaths');

const { mockUserId, mockContentId } = require('./mockData');

let mockFileId;

const S3rver = require('s3rver');
let instance;

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

describe('\'files/get*\' service', () => {

  before(function() {
    return insertMock().then(() => {
      startS3MockServer();
      process.env['STORAGE_ENDPOINT'] = 'http://localhost:9001';
    });
  });

   after(function() {
    return removeMock().then(() => {
      instance.close();
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
