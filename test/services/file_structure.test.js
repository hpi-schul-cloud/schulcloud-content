const assert = require('assert');
const app = require('../../src/app');
const contentFilepaths = app.service('content_filepaths');

const { mockUserId, mockContentId } = require('./mockData');

const mockFiles = {};

const insertMock = () => {
  const paths = [
    `${mockContentId}/index.html`,
    `${mockContentId}/menue/clip_2_1.html`,
    `${mockContentId}/menue/clip_3_1.html`,
    `${mockContentId}/menue/clip_5_1.html`,
    `${mockContentId}/menue/clip_6_1.html`
  ];
  const persistentMockData = {
    contentId: mockContentId,
    isTemp: false,
    createdBy: mockUserId
  };
  const mockCreatePromises = paths.map(filePath => {
    return contentFilepaths.create({path: filePath, ...persistentMockData})
      .then(fileObj => {
      mockFiles[fileObj.path] = fileObj._id;
    });
  });

  return Promise.all(mockCreatePromises);
};

const removeMock = () => {
  contentFilepaths
    .find({ query: { contentId: `${mockContentId}` } })
    .then(res => {
      return Promise.all(
        res.data.map(mockData => contentFilepaths.remove(mockData._id))
      );
    });
};

describe('`files/structure` service', () => {
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
        id: `${mockContentId}`,
        type: 'folder',
        name: `${mockContentId}`,
        objects: [
          {
            id: mockFiles[`${mockContentId}/index.html`],
            type: 'file',
            name: 'index.html'
          },
          {
            id: `${mockContentId}/menue`,
            type: 'folder',
            name: 'menue',
            objects: [
              {
                id: mockFiles[`${mockContentId}/menue/clip_2_1.html`],
                type: 'file',
                name: 'clip_2_1.html'
              },
              {
                id: mockFiles[`${mockContentId}/menue/clip_3_1.html`],
                type: 'file',
                name: 'clip_3_1.html'
              },
              {
                id: mockFiles[`${mockContentId}/menue/clip_5_1.html`],
                type: 'file',
                name: 'clip_5_1.html'
              },
              {
                id: mockFiles[`${mockContentId}/menue/clip_6_1.html`],
                type: 'file',
                name: 'clip_6_1.html'
              }
            ]
          }
        ]
      }
    ];
    return service.get(`${mockContentId}`).then(res => {
      assert.equal(JSON.stringify(res), JSON.stringify(expectedResult));
    });
  });
});
