const assert = require('assert');
const app = require('../../src/app');
const resourceFilepaths = app.service('resource_filepaths');

const { mockUserId } = require('./mockData');

let mocksToDelete = [];

const applyToDb = (method, data) => {
  let { _id, ...dataWithoutId } = data;
  dataWithoutId = Object.assign({ createdBy: mockUserId }, dataWithoutId);
  let apiArguments = data._id
    ? [_id.toString(), dataWithoutId]
    : [dataWithoutId];
  return resourceFilepaths[method](...apiArguments).then(filepathObj => {
    mocksToDelete.push(filepathObj._id.toString());
    return filepathObj;
  });
};

describe('\'resource_filepaths\' service', () => {
  after(() => {
    return resourceFilepaths.remove(null, {
      query: { _id: { $in: mocksToDelete } }
    });
  });

  it('registered the service', () => {
    const service = app.service('resource_filepaths');
    assert.ok(service, 'Registered the service');
  });

  it('enforces exactly one leading slash', () => {
    const expectedPath = '/folder/file.txt';
    const tests = [
      'folder/file.txt',
      '/folder/file.txt',
      '///folder/file.txt'
    ].map(async testPath => {
      const createObj = await applyToDb('create', { path: testPath });
      assert.equal(createObj.path, expectedPath);
      const patchObj = await applyToDb('patch', {
        ...createObj,
        path: testPath
      });
      assert.equal(patchObj.path, expectedPath);
      const updateObj = await applyToDb('update', {
        ...createObj,
        path: testPath
      });
      assert.equal(updateObj.path, expectedPath);
    });
    return Promise.all(tests);
  });

  it('combines multiple slashes', async () => {
    const expectedPath = '/folder1/folder2/file.txt';
    const testPath = '/folder1////folder2//file.txt';

    const createObj = await applyToDb('create', { path: testPath });
    assert.equal(createObj.path, expectedPath);
    const patchObj = await applyToDb('patch', { ...createObj, path: testPath });
    assert.equal(patchObj.path, expectedPath);
    const updateObj = await applyToDb('update', {
      ...createObj,
      path: testPath
    });
    assert.equal(updateObj.path, expectedPath);
  });

  it('converts bachslashes to slashes', async () => {
    const expectedPath = '/folder1/folder2/file.txt';
    const testPath = '\\\\folder1\\\\folder2\\file.txt';

    const createObj = await applyToDb('create', { path: testPath });
    assert.equal(createObj.path, expectedPath);
    const patchObj = await applyToDb('patch', { ...createObj, path: testPath });
    assert.equal(patchObj.path, expectedPath);
    const updateObj = await applyToDb('update', {
      ...createObj,
      path: testPath
    });
    assert.equal(updateObj.path, expectedPath);
  });
});
