const Strategy = require('passport-custom');
const basicAuth = require('basic-auth');

function checkLocalAuthentication(username, password) {
    const config = require('config');
    const localUsers = config.get('localAuthentication');
    return localUsers.find(user => { return user.username === username && user.password === password; });
}

module.exports = () => {
    return function() {
        const verifier = (req, done) => {
            const authHeader = req.params.headers['authorization'];

            let credentials = basicAuth.parse(authHeader);
            if (!credentials) {
                return done(null, false);
            }

            // Check Local config auth
            const match = checkLocalAuthentication(credentials.name, credentials.pass);

            // user will be false, if no user was matched and authorization will fail
            const user = match ? {_id: match.userId} : false;
            return done(null, user);
        };
        // register the strategy in the app.passport instance
        this.passport.use('basicAuth', new Strategy(verifier));
        // Add options for the strategy
        this.passport.options('basicAuth', {});
    };
};