#!/usr/bin/env bash
ELASTIC_HOST=${ELASTIC_HOST:="localhost"}
ELASTIC_PORT=${ELASTIC_PORT:="9200"}

mongo-connector --auto-commit-interval=0 -m localhost:27017 -t $ELASTIC_HOST:$ELASTIC_PORT -d elastic2_doc_manager -v