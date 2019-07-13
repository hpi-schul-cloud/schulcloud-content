const errors = require('@feathersjs/errors');

const skipInternal = (method) => (hook) => {
    if (typeof hook.params.provider === 'undefined') {
      return hook;
    }
    return method(hook);
  };

const getCurrentUserData = hook => {
    const userModel = hook.app.get('mongooseClient').model('users');
    return new Promise((resolve, reject) => {
        userModel.findById(hook.params.user._id, function (err, user) {
            if(err) { reject(new errors.GeneralError(err)); }
            if(!user) {
                reject(new errors.NotFound('User not found'));
            }
            hook.params.user.role = user.role;
            hook.params.user.providerId = user.providerId;
            return resolve(hook);
        });
    });
};

module.exports = {
    skipInternal,
    getCurrentUserData
};
