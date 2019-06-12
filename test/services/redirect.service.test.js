const assert = require('assert');
const rp = require('request-promise');
const app = require('../../src/app');

const PORT = 3031;

const { mockUserId, mockProviderId } = require('./mockData');

const mockResource = () => ({
  contentCategory: 'learning-object',
  description: 'Redirect To Me',
  isPublished: true,
  licenses: ['MIT'],
  mimeType: 'audio',
  originId: Date.now().toString(),
  providerId: mockProviderId,
  tags: ['Test'],
  thumbnail: 'https://schul-cloud.org/images/logo/app-icon-144.png',
  title: 'SC-Hosting :D',
  url: 'https://schul-cloud.org',
  userId: mockUserId
});

const createdMocks = [];

describe('Feathers application tests', () => {
  before(function(done) {
    app
      .service('resources')
      .create(mockResource())
      .then(mockedResource => {
        createdMocks.push(mockedResource);
        this.server = app.listen(PORT);
        this.server.once('listening', () => done());
      });
  });

  after(function(done) {
    app
      .service('resources')
      .remove(null, {
        query: { _id: { $in: createdMocks.map(mock => mock._id) } }
      })
      .then(() => {
        this.server.close(done);
      });
  });

  it('redirects to fullUrl', () => {
    const redirectTests = createdMocks.map(resource =>
      rp({
        uri: `http://localhost:${PORT}/redirect/${resource._id}`,
        resolveWithFullResponse: true
      }).then(response => {
        assert.ok(resource.url.includes(response.request.host));
      })
    );
    return Promise.all(redirectTests);
  });

  it('increments clickCount', () => {
    const redirectTests = createdMocks.map(async resourceMock => {
      const resource = await app.service('resources').get(resourceMock._id);
      const clickCountBefore = resource.clickCount;

      const response = await rp({
        uri: `http://localhost:${PORT}/redirect/${resourceMock._id}`,
        resolveWithFullResponse: true
      });
      assert.equal(response.statusCode, 200);

      const resourceAfter = await app
        .service('resources')
        .get(resourceMock._id);
      assert.equal(resourceAfter.clickCount, clickCountBefore + 1);
    });
    return Promise.all(redirectTests);
  });
});
