#!/usr/bin/env bash

if [ $1 == "seed" ]
then
    mongo --host=localhost --port=27017 --eval "rs.initiate({ _id : \"rs\", members: [ { _id : 0, host : \"localhost:27017\" } ] })"
    mongoimport --host=localhost --port=27017 --db schulcloud_content --collection resources --file ./backup/schulcloud_content/resources.json

    mongo-connector -m localhost:27017 -t localhost:9200 -d elastic2_doc_manager -v
fi
if [ $1 == "start" ]
then
    mongo-connector -m localhost:27017 -t localhost:9200 -d elastic2_doc_manager -v
fi
