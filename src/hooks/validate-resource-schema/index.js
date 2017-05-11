const commonHooks = require('feathers-hooks-common');
const Ajv         = require('ajv');
const Schema      = require('./resource-schema.json');

/*
 * Configuration can be found @ https://github.com/epoberezkin/ajv/releases/tag/5.0.0
 */
const ajv     = new Ajv({
  meta: false, // optional, to prevent adding draft-06 meta-schema
  extendRefs: true, // optional, current default is to 'fail', spec behaviour is to 'ignore'
  unknownFormats: 'ignore',  // optional, current default is true (fail)
  allErrors: true,
  // ...
});
const metaSchema = require('ajv/lib/refs/json-schema-draft-04.json');
ajv.addMetaSchema(metaSchema);
ajv._opts.defaultMeta = metaSchema.id;
// optional, using unversioned URI is out of spec, see https://github.com/json-schema-org/json-schema-spec/issues/216
ajv._refs['http://json-schema.org/schema'] = 'http://json-schema.org/draft-04/schema';
// Optionally you can also disable keywords defined in draft-06
ajv.removeKeyword('propertyNames');
ajv.removeKeyword('contains');
ajv.removeKeyword('const');

/*
 * Add hook
 */
module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return commonHooks.validateSchema(Schema, ajv);
};
