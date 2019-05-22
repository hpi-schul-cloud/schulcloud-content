const authentication = require('@feathersjs/authentication');
const commonHooks = require('feathers-hooks-common');


const authenticateHook = () =>
    commonHooks.iff(
        // if and only if the request is external
        commonHooks.every(commonHooks.isProvider('external')),
        commonHooks.iffElse(
          // if the specific header is included
          ctx => (ctx.params.headers['authorization'] || '').startsWith('Basic'),
          // authentication with this strategy
          authentication.hooks.authenticate('basicAuth'),
          // else fallback on the jwt strategy
          authentication.hooks.authenticate('jwt')
        )
    );

module.exports = authenticateHook;
