const config = require('config');

const extendUrls = resource => {
  const host = `${config.get('protocol')}://${config.get('host')}:${config.get(
    'port'
  )}/files/get/${resource._id}/`;
  ['url', 'thumbnail'].forEach(key => {
    const firstCapsKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (!resource[key].startsWith('http')) {
      resource[`full${firstCapsKey}`] =
        host + resource[key].replace(/^\/+/, '');
    }
  });
  return resource;
};

const populateResourceUrls = hook => {
  if (hook.method === 'get') {
    hook.result = extendUrls(hook.result);
  } else if (hook.method === 'find') {
    if (Array.isArray(hook.result)) {
      hook.result = hook.result.map(extendUrls);
    } else {
      hook.result.data = hook.result.data.map(extendUrls);
    }
  }
  return hook;
};

module.exports = {
  populateResourceUrls
};
