#!/usr/bin/env bash

ELASTIC_HOST=${ELASTIC_HOST:="localhost"}
ELASTIC_PORT=${ELASTIC_PORT:="9200"}
MONGO_HOST=${MONGO_HOST:="localhost"}
MONGO_PORT=${MONGO_PORT:="27017"}

if [ $1 == "seed" ]
then
  # enable replica mode of mongodb
  mongo --host=$MONGO_HOST --port=$MONGO_PORT --eval "rs.initiate({ _id : \"rs\", members: [ { _id : 0, host : \"$MONGO_HOST:$MONGO_PORT\" } ] })"
  # seed
  sh ./seed.sh
fi

mongo-connector --auto-commit-interval=0 -m $MONGO_HOST:$MONGO_PORT -t $ELASTIC_HOST:$ELASTIC_PORT -d elastic2_doc_manager -v
