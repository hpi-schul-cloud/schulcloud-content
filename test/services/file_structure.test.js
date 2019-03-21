const assert = require('assert');
const app = require('../../src/app');
const contentFilepaths = app.service('content_filepaths');

const { mockUserId, mockResourceId } = require('./mockData');

const mockFiles = {};

const insertMock = () => {
  return removeMock().then(() => {
    const paths = [
      `${mockResourceId}/index.html`,
      `${mockResourceId}/menue/clip_2_1.html`,
      `${mockResourceId}/menue/clip_3_1.html`,
      `${mockResourceId}/menue/clip_5_1.html`,
      `${mockResourceId}/menue/clip_6_1.html`
    ];
    const persistentMockData = {
      resourceId: mockResourceId,
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
  });
};

const removeMock = () => {
  return contentFilepaths
    .find({ query: { resourceId: `${mockResourceId}` } })
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
        id: `${mockResourceId}`,
        type: 'folder',
        name: `${mockResourceId}`,
        objects: [
          {
            id: mockFiles[`${mockResourceId}/index.html`],
            type: 'file',
            name: 'index.html'
          },
          {
            id: `${mockResourceId}/menue`,
            type: 'folder',
            name: 'menue',
            objects: [
              {
                id: mockFiles[`${mockResourceId}/menue/clip_2_1.html`],
                type: 'file',
                name: 'clip_2_1.html'
              },
              {
                id: mockFiles[`${mockResourceId}/menue/clip_3_1.html`],
                type: 'file',
                name: 'clip_3_1.html'
              },
              {
                id: mockFiles[`${mockResourceId}/menue/clip_5_1.html`],
                type: 'file',
                name: 'clip_5_1.html'
              },
              {
                id: mockFiles[`${mockResourceId}/menue/clip_6_1.html`],
                type: 'file',
                name: 'clip_6_1.html'
              }
            ]
          }
        ]
      }
    ];
    return service.get(`${mockResourceId}`).then(res => {
      assert.equal(JSON.stringify(res), JSON.stringify(expectedResult));
    });
  });
});
