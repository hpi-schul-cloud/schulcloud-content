const config = require('config');

const extendUrls = resource => {
  const host = `${config.get('protocol')}://${config.get('host')}:${config.get(
    'port'
  )}/files/get/${resource._id}/`;
  ['url', 'thumbnail'].forEach(key => {
    const firstCapsKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (resource[key] && !resource[key].startsWith('http')) {
      resource[`full${firstCapsKey}`] =
        host + resource[key].replace(/^\/+/, '');
    } else {
      resource[`full${firstCapsKey}`] = resource[key];
    }
  });
  return resource;
};

const populateResourceUrls = hook => {
  if (!Array.isArray(hook.result) && typeof hook.result === 'object') {
    hook.result = extendUrls(hook.result);
  } else if (Array.isArray(hook.result)) {
    hook.result = hook.result.map(extendUrls);
  } else if (Array.isArray(hook.result.data)) {
    hook.result.data = hook.result.data.map(extendUrls);
  }
  return hook;
};

module.exports = {
  populateResourceUrls
};
