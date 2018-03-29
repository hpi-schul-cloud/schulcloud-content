const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');

const getRating = context => function(resource) {
  return context.app.service('ratings').Model.aggregate([
    {$match: {materialId: resource._id}},
    {$group: {_id: "$isTeacherRating", avgRating: {$avg: "$rating"}}}
  ]).then(aggregatedRatings => {
    //TODO X make aggregate return the results in a easier to use format (using $project?)
    aggregatedRatings.forEach(it => {
      if (it._id === true) {
        resource.teacherRating = it.avgRating;
      } else if (it._id === false) {
        resource.studentRating = it.avgRating;
      }
    });
  })
};

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [authenticate, validateResourceSchema()],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [
      context =>
        Promise.all(context.result.data.map(getRating(context))).then(() => context)
    ],
    get: [
      context =>
        getRating(context)(context.result).then(() => context)
    ],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
