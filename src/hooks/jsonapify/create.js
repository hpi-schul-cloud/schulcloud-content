module.exports = function (hook) {

  if(hook.type === 'before') {

    //TODO: CHECK TYPE

    let deserializeObject = {};
    if(hook.data.hasOwnProperty('data') && hook.data.data.hasOwnProperty('attributes')) {
      deserializeObject = hook.data.data.attributes;
    }
    hook.data = deserializeObject;
  }

};
