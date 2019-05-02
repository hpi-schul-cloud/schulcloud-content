const assert = require('assert');
const app = require('../../src/app');

const serviceName = 'resources/bulk';

const mockResource = (i) => ({
  contentCategory: 'learning-object',
  description: 'ich bin ein Test',
  isPublished: false,
  licenses: ['MIT'],
  mimeType: 'audio',
  originId: Date.now().toString()+i,
  providerName: 'Khan Academy',
  tags: ['Test'],
  thumbnail: 'https://schul-cloud.org/images/logo/app-icon-144.png',
  title: 'SC-Hosting :D',
  url: 'https://schul-cloud.org',
  userId: '0000d224816abba584714c9c',
  files: {
    save: [],
    delete: [],
  }
});

/*
  All services that are based on something related to elasticsearch can't be tested,
  because elasticsearch syncs up way to slow to the mongoDB.
  We also haven't configured elastisearch on travis right now.
  I guess we should use some Docker setup for this.
*/

/*
const promiseTimeout = (delay) => {
  return new Promise((resolve) => {
    setTimeout(resolve,delay);
  });
};
*/

let mockResources = [];

describe(`${serviceName}' service`, () => {

  afterEach(function() {
    // runs after each test in this block
    const resourcesToDelete = mockResources.map((resource) => app.service('resources').remove(resource._id));
    mockResources = [];
    return Promise.all(resourcesToDelete);
  });

  it('registered the service', () => {
    const service = app.service(serviceName);
    assert.ok(service, 'Registered the service');
  });

  it('CREATE multiple resources', async () => {
    const resources = [];
    for(var i=0; i < 1000; i++){
      resources.push(mockResource(i));
    }
    const dbObjects = await app.service(serviceName).create(resources);
    assert.equal(dbObjects.length, resources.length);
    mockResources.push(...dbObjects);
  });

  it('CREATE multiple invalid resources', async () => {
    const resources = [];
    for(var i=0; i < 5; i++){
      const resource = mockResource(i);
      resource.isPublished = true;
      resource.licenses = [];
      resources.push(resource);
    }
    const dbObjects = await app.service(serviceName).create(resources);
    assert.equal(dbObjects.length, resources.length);
    mockResources.push(...dbObjects);
  });
  it('CREATE unpublishs invalid resources', async () => {
    const resources = [];
    for(var i=0; i < 5; i++){
      const resource = mockResource(i);
      resource.isPublished = true;
      resource.licenses = [];
      resources.push(resource);
    }
    const dbObjects = await app.service(serviceName).create(resources);
    dbObjects.forEach((resource) => {
      assert.equal(resource.isPublished, false);
    });
    mockResources.push(...dbObjects);
  });

  /*
  it('DELETE by query', async () => {
    const identifier = 'DELETE_by_query';

    // CREATE DATA TO DELETE
    const resources = [];
    for(var i=0; i < 5; i++){
      const resource = mockResource(i);
      resource.title = identifier;
      resource.tags = [identifier];
      resources.push(app.service('resources').create(resource));
    }
    mockResources = await Promise.all(resources);

    await promiseTimeout(30000);

    const elasticItems = await app.service('search').find({ query: {
      '_all[$match]': identifier,
      $limit: '-1',
      $select: ['_id'],
    }});

    // FAILS - elasticsearch is not syncing up to mongoDB
    assert.equal(elasticItems.total, resources.length);
  });
  */
});
