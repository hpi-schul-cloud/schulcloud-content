const assert = require('assert');
const app = require('../../src/app');
const { WritableMock } = require('stream-mock');

describe('\'files/get*\' service', () => {

  it('registered the service', () => {
    const service = app.service('files/get*');

    assert.ok(service, 'Registered the service');
  });

  it('returns file', () => {
    const service = app.service('files/get*');
    const expectedResult = '{"test": true}';

    const resStream = new WritableMock({objectMode: true});

    resStream.on('finish', ()=>{
      assert.equal(JSON.stringify(resStream.data.join('')), JSON.stringify(expectedResult));
    });

    return service.find({req: {params: {'0':'test.txt'}, res: resStream}});
  });
});
