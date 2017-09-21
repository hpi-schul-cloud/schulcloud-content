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
    echo "ASSERTION: $1 must not be a jsonapi endpoint but it is."
    exit 4
  fi
}

for accept in '*/*' 'application/*' 'application/json' 'application/vnd.api+json'
do
  header="Accept: $accept"
  assertEndpointIsJsonapi /v1/resources/ids -H "$header"
  assertEndpointIsJsonapi /v1/search -H "$header"

  assertEndpointIsNotJsonapi /search -H "$header"
  assertEndpointIsNotJsonapi /resources -H "$header"
done

assertEndpointIsJsonapi /v1/resources/ids
assertEndpointIsJsonapi /v1/search

assertEndpointIsNotJsonapi /search
assertEndpointIsNotJsonapi /resources
