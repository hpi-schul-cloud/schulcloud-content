const assert = require('assert');
const app = require('../../src/app');
const contentFilepaths = app.service('content_filepaths');

const insertMock = () => {
  const persistentMockData = {
    fileIds: [
      'content_mock_id/index.html',
      'content_mock_id/menue/clip_2_1.html',
      'content_mock_id/menue/clip_3_1.html',
      'content_mock_id/menue/clip_5_1.html',
      'content_mock_id/menue/clip_6_1.html'
    ],
    contentId: 'content_mock_id',
    isTemporary: false,
    userId: 'user_mock_id'
  };
  const insertPersistent = contentFilepaths.create(persistentMockData);

  const tempMockData = {
    fileIds: [
      'tmp/user_mock_id/content_mock_id/test.txt',
    ],
    contentId: 'content_mock_id',
    isTemporary: true,
    userId: 'user_mock_id'
  };
  const insertTemp = contentFilepaths.create(tempMockData);



  return Promise.all([insertPersistent, insertTemp]);
};

const removeMock = () => {
  contentFilepaths
    .find({ query: { contentId: 'content_mock_id' } })
    .then(res => {
      return Promise.all(
        res.data.map(mockData => contentFilepaths.remove(mockData._id))
      );
    });
};

describe('\'files/manage\' service', () => {
  it('registered the service', () => {
    const service = app.service('files/manage');

    assert.ok(service, 'Registered the service');
  });

  before(insertMock);
  after(removeMock);

  it('deletes files from DB', () => {
    const service = app.service('files/manage');

    const itemsToDelete = ['content_mock_id/index.html', 'content_mock_id/menue/clip_6_1.html'];
    const itemsToSave = [];

    return service.patch('content_mock_id', {
        delete: itemsToDelete,
        save: itemsToSave,
        userId: 'user_mock_id'
      })
      .then((res) => {
        assert.equal(res.status, 200);
        return contentFilepaths.find({query: {
          contentId: 'content_mock_id',
          userId: 'user_mock_id',
          fileIds: {$in: itemsToDelete}
        }});
      })
      .then((deleted) => {
        assert.equal(deleted.data.length, 0, 'files weren\'t deleted');
      });
  });

  it('saves files into DB', () => {
    const service = app.service('files/manage');

    const itemsToDelete = [];
    const itemsToSave = ['tmp/user_mock_id/content_mock_id/test.txt'];

    return service.patch('content_mock_id', {
        delete: itemsToDelete,
        save: itemsToSave,
        userId: 'user_mock_id'
      })
      .then((res) => {
        assert.equal(res.status, 200);
        const findSavedSrc = contentFilepaths.find({query: {
          contentId: 'content_mock_id',
          userId: 'user_mock_id',
          isTemporary: true,
          fileIds: {$in: itemsToSave}
        }});

        const findSaved = contentFilepaths.find({query: {
          contentId: 'content_mock_id',
          userId: 'user_mock_id',
          isTemporary: false,
          fileIds: {$in: itemsToSave.map(entry => entry.replace('tmp/user_mock_id/', ''))}
        }});

        return Promise.all([findSavedSrc, findSaved]);
      })
      .then(([savedSrc, saved]) => {
        assert.equal(savedSrc.data.length, 0, 'src wasn\'t deleted');
        assert.equal(saved.data.length, 1, 'new file wasn\'t moved to destination');
      });
  });

  it('manages files in DB', () => {
    const service = app.service('files/manage');

    const itemsToDelete = ['content_mock_id/index.html', 'content_mock_id/menue/clip_6_1.html'];
    const itemsToSave = ['tmp/user_mock_id/content_mock_id/test.txt'];

    return service.patch('content_mock_id', {
        delete: itemsToDelete,
        save: itemsToSave,
        userId: 'user_mock_id'
      })
      .then((res) => {
        assert.equal(res.status, 200);
        const findDeleted = contentFilepaths.find({query: {
          contentId: 'content_mock_id',
          userId: 'user_mock_id',
          fileIds: {$in: itemsToDelete}
        }});

        const findSavedSrc = contentFilepaths.find({query: {
          contentId: 'content_mock_id',
          userId: 'user_mock_id',
          isTemporary: true,
          fileIds: {$in: itemsToSave}
        }});

        const findSaved = contentFilepaths.find({query: {
          contentId: 'content_mock_id',
          userId: 'user_mock_id',
          isTemporary: false,
          fileIds: {$in: itemsToSave.map(entry => entry.replace('tmp/user_mock_id/', ''))}
        }});

        return Promise.all([findDeleted, findSavedSrc, findSaved]);
      })
      .then(([deleted, savedSrc, saved]) => {
        assert.equal(deleted.data.length, 0, 'files weren\'t deleted');
        assert.equal(savedSrc.data.length, 0, 'src wasn\'t deleted');
        assert.equal(saved.data.length, 1, 'new file wasn\'t moved to destination');
      });
  });
});
