#!/bin/bash

set -e

python3 -m schul_cloud_resources_server_tests.tests --url=http://localhost:4040/v1/ --basic=schulcloud-content-1:content-1 --basic=schulcloud-content-2:content-2 --noauth=false $@
