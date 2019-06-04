#!/usr/bin/env bash

mongo-connector --auto-commit-interval=0 -m localhost:27017 -t localhost:9200 -d elastic2_doc_manager -v
