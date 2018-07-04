const validateProposalSchema = require('../../hooks/validate-proposal-schema/');
const proposalHooks = require('../../hooks/proposals/');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [validateProposalSchema()],
    update: [],
    patch: [proposalHooks.rate],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [proposalHooks.created],
    update: [],
    patch: [proposalHooks.isApproved],
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
