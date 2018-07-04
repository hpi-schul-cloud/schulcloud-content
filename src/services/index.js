const resource = require('./resource/resource.service.js');
const proposal = require('./proposal/proposal.service.js');
const teacherContent = require('./teacherContent/teacherContent.service.js');
const searchExternal = require('./searchExternal/searchExternal.service.js');
const searchInternal = require('./searchInternal/searchInternal.service.js');
const user = require('./user/user.service.js');
module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(resource);
  app.configure(proposal);
  app.configure(teacherContent);
  app.configure(searchExternal);
  app.configure(searchInternal);
  app.configure(user);
};
