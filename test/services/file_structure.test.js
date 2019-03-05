const assert = require('assert');
const app = require('../../src/app');
const contentFilepaths = app.service('content_filepaths');

const insertMock = () => {
  const mockData = {
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
  return contentFilepaths.create(mockData);
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

describe('\'files/structure\' service', () => {
  before(insertMock);
  after(removeMock);

  it('registered the service', () => {
    const service = app.service('files/structure');

    assert.ok(service, 'Registered the service');
  });

  it('returns correct filetree', () => {
    const service = app.service('files/structure');
    const expectedResult = [
      {
        id: 'content_mock_id',
        type: 'folder',
        name: 'content_mock_id',
        objects: [
          {
            id: 'content_mock_id/index.html',
            type: 'file',
            name: 'index.html'
          },
          {
            id: 'content_mock_id/menue',
            type: 'folder',
            name: 'menue',
            objects: [
              {
                id: 'content_mock_id/menue/clip_2_1.html',
                type: 'file',
                name: 'clip_2_1.html'
              },
              {
                id: 'content_mock_id/menue/clip_3_1.html',
                type: 'file',
                name: 'clip_3_1.html'
              },
              {
                id: 'content_mock_id/menue/clip_5_1.html',
                type: 'file',
                name: 'clip_5_1.html'
              },
              {
                id: 'content_mock_id/menue/clip_6_1.html',
                type: 'file',
                name: 'clip_6_1.html'
              }
            ]
          }
        ]
      }
    ];
    return service.get('content_mock_id').then(res => {
      assert.equal(JSON.stringify(res), JSON.stringify(expectedResult));
    });
  });
});
