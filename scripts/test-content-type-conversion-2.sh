#!/bin/bash

set -e

base_url="http://schulcloud-content-1:content-1@localhost:4040"
output="/tmp/output"

function curl_with_arguments() {
  if [ -z "$1" ]
  then
    shift
  fi
  curl "$@" > "$output" 2>/dev/null
  exit_code="$?"
  echo -n "curl"
  while [ -n "$1" ]
  do
    echo -n " \"$1\""
    shift
  done
  echo " | grep '\"jsonapi\"'"
  return "$exit_code"
}

function request() {
  url="$base_url$1"
  shift
  if ! curl_with_arguments "$@" "$url"
  then
    echo "ERROR: Invalid curl command!"
    exit 2
  fi
}

function assertEndpointIsJsonapi() {
  echo -n "JSONAPI:      "
  request "$@"
  if ! ( cat "$output" | grep -q \"jsonapi\" )
  then
    cat "$output"
    echo "ASSERTION: $1 must be a jsonapi endpoint but is not."
    exit 3
  fi
}

function assertEndpointIsNotJsonapi() {
  echo -n "not JSONAPI:  "
  request "$@"
  if ( cat "$output" | grep -q \"jsonapi\" )
  then
    cat "$output"
    echo 
    echo "ASSERTION: $1 must not be a jsonapi endpoint but it is."
    exit 4
  fi
}



echo "# Test headers which force feathers results."
for accept in '*/*' 'application/*' 'application/json'
do
  header="Accept: $accept"
  assertEndpointIsNotJsonapi /v1/resources -H "$header"
  assertEndpointIsNotJsonapi /v1/search?Q=Schul -H "$header"
  assertEndpointIsNotJsonapi /v1/search -H "$header"

  assertEndpointIsNotJsonapi /search?q=Mathe -H "$header"
  assertEndpointIsNotJsonapi /search -H "$header"
  assertEndpointIsNotJsonapi /resources -H "$header"
done

jsonapi_header='Accept: application/vnd.api+json'
assertEndpointIsNotJsonapi /search?q=Mathe -H "$jsonapi_header"
assertEndpointIsNotJsonapi /search -H "$jsonapi_header"
assertEndpointIsNotJsonapi /resources -H "$jsonapi_header"

assertEndpointIsNotJsonapi /search
assertEndpointIsNotJsonapi /resources

echo "# Test jsonapi compatibility."
assertEndpointIsJsonapi /v1/resources/ids -H "$jsonapi_header"
assertEndpointIsJsonapi /v1/search -H "$jsonapi_header"
