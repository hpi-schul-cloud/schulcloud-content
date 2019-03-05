const assert = require('assert');
const app = require('../../src/app');

describe('\'files/manage\' service', () => {
  it('registered the service', () => {
    const service = app.service('files/manage');

    assert.ok(service, 'Registered the service');
  });
});
