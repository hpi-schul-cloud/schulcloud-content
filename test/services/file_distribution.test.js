const assert = require('assert');
const app = require('../../src/app');
const { WritableMock } = require('stream-mock');
const contentFilepaths = app.service('content_filepaths');

const insertMock = () => {
  const mockData = {
    path: 'test.txt',
    contentId: 'content_mock_id',
    isTemp: false,
    createdBy: 'user_mock_id'
  };
  // _id must match [a-f0-9]{25} to be accepted by feathers
  return contentFilepaths.update('5c7510725822a18234e48519', mockData, { mongoose: { upsert: true }});
};

const removeMock = () => {
  return contentFilepaths.remove('5c7510725822a18234e48519');
};

describe('\'files/get*\' service', () => {

  before(insertMock);
  after(removeMock);

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
      service.find({req: {params: {'0':'test.txt'}, res: resStream}}).catch(reject);
    });
  });
});
