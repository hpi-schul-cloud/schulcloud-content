# schulcloud-content

[![codecov](https://codecov.io/gh/schul-cloud/schulcloud-content/branch/master/graph/badge.svg)](https://codecov.io/gh/schul-cloud/schulcloud-content)

This is the content search engine for schul-cloud,
including a database to store the resources.

## Get Started

To get started developing the content service, you first need to install docker
and docker-compose. Then use docker-compose after cloning.

1. `docker-compose build`
2. `docker-compose up`

The web service runs on port `4040`. Debugging is available on port `5858` by default.

## Authentication

**ONLY IN DEVELOPMENT MODE**<br/>
set Authorization header to basic auth with the test users credentials when accessing a protected route via postman

```bash
curl -X GET \
  http://localhost:4040/resources \
  -H 'authorization: Basic b2xpdmVAZXhhbXBsZS5jb206dHJlZQ==' \
```

test users:
username            | password | role
--------------------|----------|------------
`olive@example.com` | `tree`   | `superhero`
`toi@example.com`   | `story`  | `admin`


## API
TBD

## Schema

The schema is defined in `src/models/resource.model.js`:
```
{
    originId: { type: String, unique: true, required: true },
    userId: {type: mongooseClient.Schema.Types.ObjectId, required: true },
    providerName: { type: String, required: true },

    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: {type: String },

    tags: { type: [String] },
    licenses: { type: [String], required: true },
    contentCategory: { type: String, enum: ['atomic', 'learning-object', 'proven-learning-object', 'tool'], required: true },
    mimeType: { type: String, required: true },

    promoUntil: { type: Date },
    featuredUntil: { type: Date },
    clickCount: { type: Number },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}
```

## Validation

For validating incoming resources, we're using the [JSON Schema](http://json-schema.org) definition in `src/hooks/validate-resource-schema` and the [ajv JSON Schema Validator](https://github.com/epoberezkin/ajv).

## NODE_ENV variables

node-env          | default                                    | info
------------------|--------------------------------------------|-------------------------------------------------------
NODE_ENV          |                                            | must be set to `production` in production
MONGO_HOST        | `localhost`                                | HOST of MongoDB (`mongodb` for docker)
MONGO_PORT        | `27017`                                    | PORT of MongoDB
MONGO_DATABASE    | `schulcloud_content`                       | MongoDB Database
ELASTIC_HOST      | `localhost`                                | HOSTNAME of ElasticSearch (`elasticsearch` for docker)
ELASTIC_PORT      | `9200`                                     | PORT of ElasticSearch
HOSTING_URL       | generated from config file                 | used as redirect target for SC-Hosted resources
STORAGE_KEY_ID    | `sc-devteam`                               | S3 Credentials KEY_ID, provided by Alex / Falco
STORAGE_KEY       | `undefined`                                | S3 Credentials KEY, provided by Alex / Falco
STORAGE_CONTAINER | `resource-hosting`                         | S3 Containername for content hosting
STORAGE_ENDPOINT  | `https://dev-storage.schul-cloud.org:9001` | S3 Storage Endpoint URL

MONGO_HOST         | `https://dev-storage.schul-cloud.org:9001`         | S3 Storage Endpoint URL


# What we need
Elasticsearch
check-connector.py: ELASTIC_HOST (elasticsearch (docker hostname)), ELASTIC_PORT (9200)
search.service: ELASTICSEARCH_URI (http://localhost:9200)
