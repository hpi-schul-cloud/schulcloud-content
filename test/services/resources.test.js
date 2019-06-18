const assert = require('assert');
const app = require('../../src/app');
const { mockProviderId } = require('./mockData');

const mockSubmitResource = () => ({
  contentCategory: 'learning-object',
  description: 'ich bin ein Test',
  isPublished: false,
  licenses: ['MIT'],
  mimeType: 'audio',
  originId: Date.now().toString(),
  providerId: mockProviderId,
  tags: ['Test'],
  thumbnail: 'https://schul-cloud.org/images/logo/app-icon-144.png',
  title: 'SC-Hosting :D',
  url: 'https://schul-cloud.org',
  userId: '0000d224816abba584714c9c',
  files: {
    save: [],
    delete: []
  }
});

const createdMocks = [];

describe('\'resources\' service', () => {
  after(() => {
    return app.service('resources').remove(null, {
      query: { _id: { $in: createdMocks.map(mock => mock._id) } }
    });
  });

  it('registered the service', () => {
    const service = app.service('resources');
    assert.ok(service, 'Registered the service');
  });

  it('saves resource', async () => {
    const mockData = mockSubmitResource();
    const dbObject = await app.service('resources').create(mockData);
    Object.entries(mockData).forEach(([key, value]) => {
      if (['files'].includes(key)) {
        return; // Skip
      }
      assert.equal(JSON.stringify(dbObject[key]), JSON.stringify(value));
    });
    createdMocks.push(dbObject);
  });

  it('full urls are created', async () => {
    const mockData = {
      ...mockSubmitResource(),
      url: '/index.html',
      thumbnail: '/escaperoom.png'
    };
    assert.ok(!mockData.url.startsWith('http'));
    assert.ok(!mockData.thumbnail.startsWith('http'));
    const createdObject = await app.service('resources').create(mockData);

    createdMocks.push(createdObject);

    const dbObject = await app.service('resources').get(createdObject._id);
    assert.ok(!dbObject.url.startsWith('http'));
    assert.ok(dbObject.fullUrl.startsWith('http'));
    assert.ok(!dbObject.thumbnail.startsWith('http'));
    assert.ok(dbObject.fullThumbnail.startsWith('http'));
  });
});
