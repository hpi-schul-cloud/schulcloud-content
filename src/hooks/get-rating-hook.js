const ObjectId = require('mongoose').Types.ObjectId;

const getRating = context => function(resource) {
  return context.app.service('ratings').Model.aggregate([
    {$match: {materialId: ObjectId(resource._id)}},
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
  find: context => Promise.all(context.result.data.map(getRating(context))).then(() => context),
  get: context => getRating(context)(context.result).then(() => context)
};
