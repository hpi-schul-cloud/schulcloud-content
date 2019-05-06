class ResourceBulkService {
  constructor(app) {
    this.app = app;
    this.patchNative = async (query, data) => {
      const ids = await this.app
        .service('search')
        .find({ query: { ...query, $select: ['_id'] } });
      // TODO MAYBE CHUNK REQUEST WITH TRANSACTIONS
      return await this.app
        .service('resources')
        .patch(null, data, { query: { _id: { $in: ids } } });
    };
    this.patchReplace = async (query, data) => {
      const results = await this.app
        .service('search')
        .find({
          query: { ...query, $limit: '-1', $select: ['_id', ...Object.keys(data)] }
        });
      // TODO MAYBE CHUNK REQUEST WITH TRANSACTIONS
      const patchProcesses = results.map((result) => {
        const newData = {};
          Object.entries(data).forEach(([key,value]) => {
            if(query['$replace'][key] !== undefined){
              const inlineQuery = query['$replace'][key];
              newData[key] = result[key].replace(inlineQuery,value);
            }else{
              newData[key] = value;
            }
          });
        return this.app
          .service('resources')
          .patch(result._id, newData);
      });
      return Promise.all(patchProcesses);
    };
  }

  async create(data, params) {
    if (!Array.isArray(data)) {
      throw new Error('use /resources for singular updates');
    }
    return this.app.service('resources').create(data, params);
  }

  async patch(id, data, { query }) {
    if (id) {
      throw new Error('use /resources for singular updates');
    }
    const result =
      query['$replace'] === undefined
        ? this.patchNative(query, data)
        : this.patchReplace(query, data);
    return result;
  }

  async remove(id, { query }) {
    if (id) {
      throw new Error('use /resources for singular updates');
    }
    // TODO MAYBE CHUNK REQUEST WITH TRANSACTIONS
    const ids = await this.app.service('search').find({ query });
    const result = await this.app
      .service('resources')
      .remove(null, { query: { _id: { $in: ids } } });
    return result;
  }
}

module.exports = {
  ResourceBulkService
};
