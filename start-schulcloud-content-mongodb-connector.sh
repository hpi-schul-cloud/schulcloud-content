#!/usr/bin/env bash

if [ $1 == "seed" ]
then
    mongo --host=$MONGO_URI --port=$MONGO_PORT --eval "rs.initiate({ _id : \"rs\", members: [ { _id : 0, host : \"$MONGO_URI:$MONGO_PORT\" } ] })"
    mongoimport --host=$MONGO_URI --port=$MONGO_PORT --db schulcloud_content --collection resources --file /usr/src/connector/backup/schulcloud_content/resources.json

    cd /
    mongo-connector -m mongodb:27017 -t elasticsearch:9200 -d elastic2_doc_manager -v
fi
if [ $1 == "start" ]
then
    cd /
    mongo-connector -m mongodb:27017 -t elasticsearch:9200 -d elastic2_doc_manager -v
fi

if [ -z $1 ]
then
    pip install mongo-connector
    pip install elastic2-doc-manager[elastic5]
    pip install pymongo
    pip install elaticsearch

    # install mongodb tools and shell
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6 && \
    echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.4 main" | tee /etc/apt/sources.list.d/mongodb-org-3.4.list && \
    apt-get update && \
    apt-get install -y mongodb-org-tools mongodb-org-shell

    # check whether mongodb and elasticsearch are online
    python /usr/src/connector/check.py
fi
