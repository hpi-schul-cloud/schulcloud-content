const assert = require('assert');
const app = require('../../src/app');

const mockSubmitResource = () => ({
  contentCategory: 'learning-object',
  description: 'ich bin ein Test',
  isPublished: false,
  licenses: ['MIT'],
  mimeType: 'audio',
  originId: Date.now().toString(),
  providerName: 'Khan Academy',
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

describe('\'resources\' service', () => {
  it('registered the service', () => {
    const service = app.service('resources');
    assert.ok(service, 'Registered the service');
  });

  it('saves resource', async () => {
    const mockData = mockSubmitResource();
    const dbObject = await app.service('resources').create(mockData);
    Object.entries(mockData).forEach(([key, value]) => {
      if (['files'].includes(key)) {
        return;
      } // Skip
      assert.equal(JSON.stringify(dbObject[key]), JSON.stringify(value));
    });
  });

  it('short url gets saved and extended on CREATE', async () => {
    const mockData = {
      ...mockSubmitResource(),
      url: '/index.html',
      thumbnail: '/escaperoom.png'
    };
    assert.ok(!mockData.url.startsWith('http'));
    assert.ok(!mockData.thumbnail.startsWith('http'));
    const dbObject = await app.service('resources').create(mockData);
    assert.ok(dbObject.url.startsWith('http'));
    assert.ok(dbObject.thumbnail.startsWith('http'));
  });

  it('short url gets saved and extended on PATCH', async () => {
    const mockExisting = mockSubmitResource();
    const mockData = {
      ...mockSubmitResource(),
      url: '/index.html',
      thumbnail: '/escaperoom.png'
    };
    const existingObject = await app.service('resources').create(mockExisting);
    assert.equal(mockExisting.url, existingObject.url);
    assert.equal(mockExisting.thumbnail, existingObject.thumbnail);

    const dbResultObject = await app
      .service('resources')
      .patch(existingObject._id, { ...mockData });

    const dbObject = await app.service('resources').get(existingObject._id);

    [dbResultObject, dbObject].forEach(obj => {
      assert.ok(obj.url.endsWith(mockData.url));
      assert.ok(obj.url.startsWith('http'));
      assert.ok(obj.thumbnail.endsWith(mockData.thumbnail));
      assert.ok(obj.thumbnail.startsWith('http'));
    });
  });
});
