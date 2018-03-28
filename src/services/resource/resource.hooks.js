const validateResourceSchema = require('../../hooks/validate-resource-schema/');
const authenticate = require('../../hooks/authenticate');

const getRating = context => {
  //TODO X if requested via context.params.query
  const ratingService = context.app.service('ratings');
  return ratingService.find({
    query: {
      // $select: 'rating',
      // materialId: context.id,
      isTeacherRating: true
    }
  }).then(ratingValues => {
    console.log('blaaa');
    // console.log(ratingValues);
    //TODO X modify context.result

  }, error => {
    console.error('erroooooor')
  }).then(() => {
    return context;
  });
};

module.exports = {
  before: {
    all: [],
    find: [],
    get: [getRating],
    create: [authenticate, validateResourceSchema()],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
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
