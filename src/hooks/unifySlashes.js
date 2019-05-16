const unifySlashes = key => obj => {
  if (!obj[key]) {
    return obj;
  }
  // convert backslashes to slashes
  // enforce exactly one leading slash
  // no multiple slashes next to each other '///' => '/'
  obj[key] =
    '/' +
    obj[key]
      .replace(/\\/g, '/')
      .replace(/^\/+/g, '')
      .replace(/\/{2,}/g, '/');
  return obj;
};

module.exports = {
  unifySlashes
};
