const Strategy = require('passport-custom');
const basicAuth = require('basic-auth');
var bcrypt = require('bcryptjs');

module.exports = function(){
    return function(app) {
        const verifier = (req, done) => {
            const userModel = app.get('mongooseClient').model('users');
            const authHeader = req.params.headers['authorization'];

            let credentials = basicAuth.parse(authHeader);
            if (!credentials) {
                return done(null, false);
            }

            userModel.findOne({ username: credentials.name}, function (err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username' });
                }
                let hashedPassword = user.password;
                if (bcrypt.compareSync(credentials.pass, hashedPassword)){
                    return done(null, {_id: user._id});
                } else return done(null, false, { message: 'Incorrect password' });
            });
        };
        // register the strategy in the app.passport instance
        this.passport.use('basicAuth', new Strategy(verifier));
        // Add options for the strategy
        this.passport.options('basicAuth', {});
    };
};