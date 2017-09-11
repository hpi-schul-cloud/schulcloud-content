module.exports = function (hook) {

  if(hook.type === 'before') {

    //TODO: CHECK TYPE

    let deserializeObject = {};
    if(hook.data.hasOwnProperty('data') && hook.data.data.hasOwnProperty('attributes')) {
      deserializeObject = hook.data.data.attributes;
    }
    console.log("deserializeObject:", deserializeObject)
    hook.data.attributes = deserializeObject;
  } else if(hook.type === 'after') {

  }

};
