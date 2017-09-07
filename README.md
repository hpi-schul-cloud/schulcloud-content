# schulcloud-content

> 

## About

This project uses [Feathers](http://feathersjs.com). An open source web framework for building modern real-time applications.

## Getting Started

Getting up and running is as easy as 1, 2, 3.

1. Make sure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Install your dependencies

    ```
    cd path/to/schulcloud-content; npm install
    ```
3. Install [Mongodb](https://mongodb.com).
4. Start mongodb

    ```
    mongod --dbpath db
    ```
    It should look like this:
    ```
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten] MongoDB starting : pid=579 port=27017 dbpath=db 64-bit host=ubuntu
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten] db version v3.4.8
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten] git version: 8ef456f89f63ab12941fe6b5352b20cff2522da3
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten] OpenSSL version: OpenSSL 1.0.2g  1 Mar 2016
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten] allocator: tcmalloc
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten] modules: none
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten] build environment:
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten]     distmod: ubuntu1604
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten]     distarch: x86_64
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten]     target_arch: x86_64
    2017-09-07T01:49:49.657-0700 I CONTROL  [initandlisten] options: { storage: { dbPath: "db" } }
    2017-09-07T01:49:49.657-0700 W -        [initandlisten] Detected unclean shutdown - db/mongod.lock is not empty.
    2017-09-07T01:49:49.717-0700 I -        [initandlisten] Detected data files in db created by the 'wiredTiger' storage engine, so setting the active storage engine to 'wiredTiger'.
    2017-09-07T01:49:49.717-0700 W STORAGE  [initandlisten] Recovering data from the last clean checkpoint.
    2017-09-07T01:49:49.717-0700 I STORAGE  [initandlisten] 
    2017-09-07T01:49:49.717-0700 I STORAGE  [initandlisten] ** WARNING: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine
    2017-09-07T01:49:49.717-0700 I STORAGE  [initandlisten] **          See http://dochub.mongodb.org/core/prodnotes-filesystem
    2017-09-07T01:49:49.717-0700 I STORAGE  [initandlisten] wiredtiger_open config: create,cache_size=256M,session_max=20000,eviction=(threads_min=4,threads_max=4),config_base=false,statistics=(fast),log=(enabled=true,archive=true,path=journal,compressor=snappy),file_manager=(close_idle_time=100000),checkpoint=(wait=60,log_size=2GB),statistics_log=(wait=0),
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] 
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] ** WARNING: Access control is not enabled for the database.
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] **          Read and write access to data and configuration is unrestricted.
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] 
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] 
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] ** WARNING: /sys/kernel/mm/transparent_hugepage/enabled is 'always'.
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] **        We suggest setting it to 'never'
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] 
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] ** WARNING: /sys/kernel/mm/transparent_hugepage/defrag is 'always'.
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] **        We suggest setting it to 'never'
    2017-09-07T01:49:50.832-0700 I CONTROL  [initandlisten] 
    2017-09-07T01:49:50.975-0700 I FTDC     [initandlisten] Initializing full-time diagnostic data capture with directory 'db/diagnostic.data'
    2017-09-07T01:49:50.977-0700 I NETWORK  [thread1] waiting for connections on port 27017
    2017-09-07T01:49:51.036-0700 I FTDC     [ftdc] Unclean full-time diagnostic data capture shutdown detected, found interim file, some metrics may have been lost. OK

    2017-09-07T01:55:45.041-0700 I NETWORK  [thread1] connection accepted from 127.0.0.1:37818 #1 (1 connection now open)
    2017-09-07T01:55:45.052-0700 I NETWORK  [conn1] received client metadata from 127.0.0.1:37818 conn1: { driver: { name: "nodejs", version: "2.2.31" }, os: { type: "Linux", name: "linux", architecture: "x64", version: "4.4.0-92-generic" }, platform: "Node.js v6.11.3, LE, mongodb-core: 2.1.15" }
    2017-09-07T01:55:45.092-0700 I INDEX    [conn1] build index on: test.resources properties: { v: 2, unique: true, key: { originId: 1 }, name: "originId_1", ns: "test.resources", background: true }
    2017-09-07T01:55:45.092-0700 I INDEX    [conn1] build index done.  scanned 0 total records. 0 secs
    ```
    
5. You will need to open a new command window while mongodb is running.
   Tell the content service where to find mongodb: on your computer.
   (In the cloud it may be on another host.)
   ```
   export MONGO_URI=127.0.0.1
   ```

6. Start your app

    ```
    npm start
    ```

## Testing

Simply run `npm test` and all your tests in the `test/` directory will be run.

## Scaffolding

Feathers has a powerful command line interface. Here are a few things it can do:

```
$ npm install -g feathers-cli             # Install Feathers CLI

$ feathers generate service               # Generate a new Service
$ feathers generate hook                  # Generate a new Hook
$ feathers generate model                 # Generate a new Model
$ feathers help                           # Show all commands
```

## Help

For more information on all the things you can do with Feathers visit [docs.feathersjs.com](http://docs.feathersjs.com).

## Changelog

__0.1.0__

- Initial release

## License

Copyright (c) 2016

Licensed under the [MIT license](LICENSE).
