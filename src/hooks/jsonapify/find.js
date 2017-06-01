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

  let result = {
    links: {self: self},
    data: []
  };
  hook.result.data.forEach(function(data, index) {
    // Get object attributes and exclude some keys
    let attributes = Object.keys(data).filter(x => !(x === '_id' || x === '__v') );
    // Serialize to JSONAPI object
    let jsonItem = new JSONAPISerializer(modelName, data, {
      id: '_id',
      pluralizeType: false,
      attributes: attributes
    });
    // Add to result array
    result.data[index] = jsonItem.data;
  });

  hook.result = result;
};
