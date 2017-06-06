#!/usr/bin/env bash

pip install mongo-connector
pip install elastic2-doc-manager[elastic5]

# TODO: Find better method for checking, that mongodb and elasticsearch are online
sleep 10

cd /
mongo-connector -m mongodb:27017 -t elastic:changeme@elasticsearch:9200 -d elastic2_doc_manager -v
