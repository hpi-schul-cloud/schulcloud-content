const unifySlashes = url => {
  // convert backslashes to slashes
  // enforce exactly one leading slash
  // no multiple slashes next to each other '///' => '/'
  return (
    '/' +
    url
      .replace(/\\/g, '/')
      .replace(/^\/+/g, '')
      .replace(/\/{2,}/g, '/')
  );
};

module.exports = {
  unifySlashes
};
