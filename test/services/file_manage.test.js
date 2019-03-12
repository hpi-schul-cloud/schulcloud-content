const assert = require('assert');
const app = require('../../src/app');
const contentFilepaths = app.service('content_filepaths');

const { mockUserId, mockContentId } = require('./mockData');

const deleteMockFiles = [];
const saveMockFiles = [];

const insertMock = () => {
  const paths = [
    `${mockContentId}/index.html`,
    `${mockContentId}/menue/clip_2_1.html`,
    `${mockContentId}/menue/clip_3_1.html`,
    `${mockContentId}/menue/clip_5_1.html`,
    `${mockContentId}/menue/clip_6_1.html`
  ];
  const persistentMockData = {
    contentId: `${mockContentId}`,
    isTemp: false,
    createdBy: mockUserId
  };
  const tempMockData = {
    path: `${mockContentId}/test.txt`,
    contentId: `${mockContentId}`,
    isTemp: true,
    createdBy: mockUserId
  };

  return removeMock()
    .then(() => {
      const insertPersistent = paths.map(filePath => {
        contentFilepaths.create({path: filePath, ...persistentMockData}).then(fileObj => {
          deleteMockFiles.push(fileObj._id);
        });
      });
      const insertTemp = contentFilepaths.create(tempMockData).then(fileObj => {
        saveMockFiles.push(fileObj._id);
      });

      return Promise.all([...insertPersistent, insertTemp]);
    });
};

const removeMock = () => {
  return contentFilepaths
    .find({ query: { contentId: `${mockContentId}` } })
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

  
  before(function() {
    return insertMock();
  });
  
  after(function() {
    return removeMock();
  });

  it('manages files in DB', () => {
    const service = app.service('files/manage');

    const itemsToDelete = [deleteMockFiles[0], deleteMockFiles[deleteMockFiles.length - 1]];
    const itemsToSave = saveMockFiles;

    return service.patch(`${mockContentId}`, {
        delete: itemsToDelete,
        save: itemsToSave,
        userId: mockUserId
      })
      .then((res) => {
        assert.equal(res.status, 200);
        const findDeleted = contentFilepaths.find({query: {
          _id: {$in: itemsToDelete},
          contentId: `${mockContentId}`,
          createdBy: mockUserId,
          isTemp: false,
        }});

        const findSavedSrc = contentFilepaths.find({query: {
          _id: {$in: itemsToSave},
          contentId: `${mockContentId}`,
          createdBy: mockUserId,
          isTemp: true,
        }});

        const findSaved = contentFilepaths.find({query: {
          _id: {$in: itemsToSave},
          contentId: `${mockContentId}`,
          createdBy: mockUserId,
          isTemp: false,
        }});

        return Promise.all([findDeleted, findSavedSrc, findSaved]);
      })
      .then(([deleted, savedSrc, saved]) => {
        assert.equal(deleted.data.length, 0, 'files weren\'t deleted');
        assert.equal(savedSrc.data.length, 0, 'src wasn\'t deleted');
        assert.equal(saved.data.length, itemsToSave.length, 'new file wasn\'t moved to destination');
      });
  });
});
