#!/bin/bash

set -e

python3 -m schul_cloud_search_tests.search http://localhost:4040/v1/search --query "Q=Schul"
