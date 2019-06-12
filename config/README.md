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
- `mongodb` contains the host name of the Mongo database service which is to use. Can be configured using the env variables `MONGO_HOST`, `MONGO_PORT` and `MONGO_DATABASE`
