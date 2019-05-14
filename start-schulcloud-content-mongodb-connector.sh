#!/usr/bin/env bash

if [ $1 == "seed" ]
then
    mongo --host=$MONGO_URI --port=$MONGO_PORT --eval "rs.initiate({ _id : \"rs\", members: [ { _id : 0, host : \"$MONGO_URI:$MONGO_PORT\" } ] })"
    mongoimport --host=$MONGO_URI --port=$MONGO_PORT --db schulcloud_content --collection resources --file /usr/src/connector/backup/schulcloud_content/resources.json

    cd /
    mongo-connector --auto-commit-interval=0 -m mongodb:27017 -t elasticsearch:9200 -d elastic2_doc_manager -v
fi
if [ $1 == "start" ]
then
    cd /
    mongo-connector --auto-commit-interval=0 -m mongodb:27017 -t elasticsearch:9200 -d elastic2_doc_manager -v
fi
