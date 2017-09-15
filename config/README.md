# config

This folder contais the configuration of a the content service.
See the [config][package] for how it works and how to use it.

The following variables are defined here:

- `host` is the host name of the service.
- `port` is the http port to listen at for requests.
- `public` is a public directory.
- `paginate` are settings for splitting huge listings into pages.
  - `default` is a number of items per page whic is to use if nothing else is requested.
  - `max` is the maximum number to request.
- `mongodb` contains the host name of the Mongo database service which is to use.
  It is `MONGO_URI` by default, so the host name is loaded from the environment variable `MONGO_URI`.
- `localAuthentication` is a list of authentications to use for development purposes.
  Each object inside needs the following attributes:
  - `userId` is the database id of the user.
  - `username` is the user name used for basic authentication.
  - `password` is the password used for basic authentication.
  
  If you put this object inside `localAutehntication`,
  
        {
          "userId": "sc-content-1",
          "username": "schulcloud-content-1",
          "password": "content-1"
        },
  
  you can authenticate the database user `sc-content-1` with this curl command:
  
        curl -X POST http://schulcloud-content-1:content-1@localhost:4040/resources

[package]: https://www.npmjs.com/package/config
