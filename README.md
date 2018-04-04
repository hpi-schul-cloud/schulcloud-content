# schulcloud-content

This is the content search engine for schul-cloud,
including a database to store the resources.

## Get Started

To get started developing the content service, you first need to install docker
and docker-compose. Then use docker-compose after cloning.

1. `docker-compose build`
2. `docker-compose up`

The web service runs on port `4040`. Debugging is available on port `5858` by default.

## Authentication
TBD

## API
TBD

## Schema

The schema is defined in `src/models/resource-model.js`:
```
{
    originId: { type: String, unique: true, required: true },
    userId: { type: mongooseClient.Schema.Types.ObjectId, required: true },
    providerName: { type: String, required: true },

    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String },

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
