const _patchNative = app => {
  return async (query, data) => {
    const ids = await app
      .service('search')
      .find({ query: { ...query, $select: ['_id'] } });
    return await app
      .service('resources')
      .patch(null, data, { query: { _id: { $in: ids } } });
  };
};

const _patchReplace = app => {
  return async (query, data) => {
    const results = await app.service('search').find({
      query: {
        ...query,
        $limit: '-1',
        $select: ['_id', ...Object.keys(data)]
      }
    });
    const patchProcesses = results.map(result => {
      // generate data to patch
      const newData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (query['$replace'][key] !== undefined) {
          if (
            Array.isArray(result[key]) ||
            Array.isArray(query['$replace'][key])
          ) {
            /*
               DB - Search - replace => result
            1. [1,2,3] - []  - [4] => [1,2,3,4]
            2. [1,2,3] - [2] - [4] => [1,3,4]
            3. [1,2,3] -     - [4] => [4]
            4.         -     - [4] => [4]
            5. ["abc", "d"] - ["b"] - ["e"] => ["abc", "d", "e"]
            6. ["abc", "b", "d"] - ["b"] - ["e"] => ["abc", "d", "e"]
            */
            // 4. || 3.
            if (
              result[key] === undefined ||
              query['$replace'][key] === undefined
            ) {
              newData[key] = value;
            } else {
              // 1. & 2. & 5. & 6.
              let search = query['$replace'][key];
              if (!Array.isArray(search)) {
                search = search ? [search] : [];
              }
              newData[key] = result[key].filter(item => !search.includes(item));
              newData[key].push(...value);
            }
          } else {
            const inlineQuery = new RegExp(query['$replace'][key]);
            newData[key] = result[key].replace(inlineQuery, value);
          }
        } else {
          newData[key] = value;
        }
      });
      // make patch request
      return app.service('resources').patch(result._id, newData);
    });
    return Promise.all(patchProcesses).catch(error => {
      // revert all changes on error
      const revertProcesses = results.map(result => {
        const newData = {};
        Object.keys(data).forEach(key => {
          newData[key] = result[key];
        });
        return app.service('resources').patch(result._id, newData);
      });
      return Promise.all(revertProcesses).finally(() => {
        // throw original error
        throw error;
      });
    });
  };
};

class ResourceBulkService {
  constructor(app) {
    this.app = app;
    this.patchNative = _patchNative(app);
    this.patchReplace = _patchReplace(app);
  }

  async create(data, params) {
    if (!Array.isArray(data)) {
      throw new Error('use /resources for single create');
    }
    return this.app.service('resources').create(data, params);
  }

  async patch(id, data, { query }) {
    if (id) {
      throw new Error('use /resources for single patches');
    }
    const result =
      query['$replace'] === undefined
        ? this.patchNative(query, data)
        : this.patchReplace(query, data);
    return result;
  }

  async remove(id, { query }) {
    if (id) {
      throw new Error('use /resources for single updates');
    }
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
