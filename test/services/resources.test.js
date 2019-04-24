const assert = require('assert');
const app = require('../../src/app');

const mockSubmitResource = () => ({
  contentCategory: 'learning-object',
  description: 'ich bin ein Test',
  isPublished: true,
  licenses: ['MIT'],
  mimeType: 'audio',
  originId: Date.now(),
  providerName: 'Khan Academy',
  tags: ['Test'],
  thumbnail: 'https://schul-cloud.org/images/logo/app-icon-144.png',
  title: 'SC-Hosting :D',
  url: 'https://schul-cloud.org',
  userId: '0000d224816abba584714c9c',
});

describe('\'resources\' service', () => {
  it('registered the service', () => {
    const service = app.service('resources');
    assert.ok(service, 'Registered the service');
  });

  it('short url gets saved on CREATE', async () => {
    const mockData = {
      ...mockSubmitResource,
      url: '/59919169c9df580090bc0815/index.html',
      thumbnail: '/escaperoom.png'
    };
    assert.ok(!mockData.url.startsWith('http'));
    assert.ok(!mockData.thumbnail.startsWith('http'));
    const dbObject = await app.service('resources').create(mockData);
    assert.ok(dbObject.url.startsWith('http'));
    assert.ok(dbObject.thumbnail.startsWith('http'));
  });

  it('short url gets saved on PATCH', async () => {
    const mockExisting = mockSubmitResource();
    const mockData = {
      ...mockSubmitResource(),
      url: '/59919169c9df580090bc0815/index.html',
      thumbnail: '/escaperoom.png'
    };
    const existingObject = await app.service('resources').create(mockExisting);
    assert.equal(mockExisting.url, existingObject.url);
    assert.equal(mockExisting.thumbnail, existingObject.thumbnail);

    const dbObject = await app.service('resources').patch(existingObject._id, mockData);
    assert.ok(dbObject.url.endsWith(mockData.url));
    assert.ok(dbObject.url.startsWith('http'));
    assert.ok(dbObject.thumbnail.endsWith(mockData.thumbnail));
    assert.ok(dbObject.thumbnail.startsWith('http'));
  });
});
