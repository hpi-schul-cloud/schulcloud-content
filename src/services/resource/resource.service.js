// Initializes the `content` service on path `/content`
const { Service } = require('feathers-mongoose');
const createModel = require('../../models/resource.model');
const hooks = require('./resource.hooks');

class MyService extends Service {
    find(params) {
        if(params.query.getCount){
            delete params.query.getCount
            return Promise.all([
                this.Model.db.collections.resources.count(),
                super.find(params)
            ]).then(([ count, response ]) => {
                console.dir(count)
                response.count = count;
                return response;
            })
        }

        return super.find(params);
    }
}

module.exports = function () {
    const app = this;
    const Model = createModel(app);
    const paginate = app.get('paginate');

    const options = {
        name: 'resources',
        Model,
        paginate
    };

    // Initialize our service with any options it requires
    app.use('/resources', new MyService(options));

    // Get our initialized service so that we can register hooks and filters
    const service = app.service('resources');

    service.hooks(hooks);
};
