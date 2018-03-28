const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');

const average = array => array.reduce((a, b) => a + b, 0) / array.length;

const getRating = context => {
  if(context.params.query.rating === undefined || context.params.query.rating !== 'true'){
    return context;
  }

  const ratingService = context.app.service('ratings');
  return Promise.all([ratingService.find({
    query: {
      $limit: 999999,
      $select: 'rating',
      materialId: context.id,
      isTeacherRating: true
    }
  }), ratingService.find({
    query: {
      $limit: 999999,
      $select: 'rating',
      materialId: context.id,
      isTeacherRating: false
    }
  })]).then(([teacherRatings, studentRatings]) => {
    context.result.teacherRating = teacherRatings.total === 0 ? -1 : average(teacherRatings.data.map(it => it.rating));
    context.result.studentRating = studentRatings.total === 0 ? -1 : average(studentRatings.data.map(it => it.rating));
    return context;
  });
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
    find: [],
    get: [getRating],
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
