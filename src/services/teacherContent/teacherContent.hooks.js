const validateTeacherContentSchema = require('../../hooks/validate-techer-content-schema/');
// const teacherContentHooks = require('../../hooks/teacherContent/');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [validateTeacherContentSchema()],
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
