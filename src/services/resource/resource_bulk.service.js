class ResourceBulkService {
  constructor(app) {
    this.app = app;
  }

  async create(data, params) {
    return this.app.service('resources').create(data, params);
  }

  async patch(id, data, { query }) {
    if (id) {
      throw new Error('use /resources for singular updates');
    }
    const ids = await this.app.service('search').find({ query });
    // TODO MAYBE CHUNK REQUEST WITH TRANSACTIONS
    const result = await this.app
      .service('resources')
      .patch(null, data, { query: { _id: { $in: ids } } });
    return result;
  }

  async remove(id, {query }) {
    if (id) {
      throw new Error('use /resources for singular updates');
    }
    const ids = await this.app.service('search').find({ query });
    // TODO MAYBE CHUNK REQUEST WITH TRANSACTIONS
    const result = await this.app
      .service('resources')
      .remove(null, { query: { _id: { $in: ids } } });
    return result;
  }
}

module.exports = {
  ResourceBulkService
};
