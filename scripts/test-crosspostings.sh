#!/bin/bash
#
# With this script we post two resources to the two APIs and try
# to retrieve them.
#
#

set -e

randomId="`cat /dev/urandom | head -c10 | base64`"
title="Die Schul-Cloud im Mathematikunterricht"
description1="This is a description which should be posted to the /resources"
description2="This is the description posted to the resource api at /v1/resources."
output="/tmp/test.out"


function testBothResourcesAreRetrieved() {
  escaped_title=`echo \"$title\" | sed 's/ /%20/g'`
  url="$1$escaped_title"
  echo
  echo "Testing url: $url"
  ct="application/vnd.api+json"
  curl -s  -H "Content-Type: $ct" "$url" > "$output"
  i="1"
  for description in "$description1" "$description2"
  do
    echo -n "Testing description$i:"
    if ! ( cat "$output" | grep -q "$description" )
    then
      echo
      echo "ERROR: description could not be found."
      cat "$output"
      exit 1
    else
      echo " OK"
    fi
    i="$(( i + 1 ))"
  done
}


echo "post to /resources with $description1"
# see https://github.com/schul-cloud/schulcloud-content/pull/36#issuecomment-331118751
curl --fail -X POST -H "Content-Type: application/vnd.api+json" "http://schulcloud-content-1:content-1@localhost:4040/resources" --data '{"data":{"attributes":{"originId": "'"$randomId"'", "providerName": "curl test", "url": "http://localhost:4040/resource", "title":"'"$title"'", "description": "'"$description1"'", "licenses":["none"], "contentCategory": "atomic", "mimeType": "applcation/json" }}}'

echo
echo
echo "post to /v1/resources"
# see ../README.md
curl -X POST "http://schulcloud-content-1:content-1@localhost:4040/v1/resources"\
     -H "Accept: application/vnd.api+json" \
     -H "Content-Type: application/vnd.api+json" \
     --data "{  \"data\": {    \"type\": \"resource\",    \"attributes\": { 
                \"title\": \"$title\",      \"url\": \"https://example.org\",  
                \"licenses\": [],      \"mimeType\": \"text/html\",     
                \"contentCategory\": \"l\",      \"languages\": [       
                   \"en-en\"      ],     
                \"thumbnail\": \"http://cache.schul-cloud.org/thumbs/k32164876328764872384.jpg\",  
                \"description\" : \"$description2\"
             }}}"
echo
echo
echo "Waiting for elastisearch."
sleep 10

echo
echo "Query the resources."

testBothResourcesAreRetrieved "http://localhost:4040/v1/search?Q="
testBothResourcesAreRetrieved "http://localhost:4040/search?q="
