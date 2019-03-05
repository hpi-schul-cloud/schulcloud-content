const assert = require('assert');
const app = require('../../src/app');

describe('\'files/upload\' service', () => {
  it('registered the service', () => {
    const service = app.service('files/upload');

    assert.ok(service, 'Registered the service');
  });

  it('returns correct filetree', () => {
    const service = app.service('files/upload');

    const expectedResult = '';

    return service.create().then(res => {
      assert.equal(res, expectedResult);
    });
  });
});
