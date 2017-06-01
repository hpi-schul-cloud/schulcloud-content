const JSONAPISerializer = require('jsonapi-serializer').Serializer;

module.exports = function (hook) {

  // Only run on after hooks
  if(hook.type !== 'after')
    return;

  // Self link
  let self = hook.params.req.url = hook.params.req.protocol +
    '://' + hook.params.req.get('host') + hook.params.req.originalUrl;

  // Get the model name
  let modelName = hook.service.Model.modelName;
  // Get object attributes and exclude some keys
  let attributes = Object.keys(hook.result).filter(x => !(x === '_id' || x === '__v') );
  // Serialize to JSONAPI object
  let jsonItem = new JSONAPISerializer(modelName, hook.result, {
    id: '_id',
    topLevelLinks: {
      self: self
    },
    pluralizeType: false,
    attributes: attributes
  });

  hook.result = jsonItem;
};
