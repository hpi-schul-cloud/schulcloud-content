const Ajv         = require('ajv');
const resourceSchema = require('../../hooks/validate-resource-schema/resource-schema.json');

class ResourceValidationService {
  constructor(app) {
    this.app = app;
  }

  async create(data, params) {

    delete resourceSchema["$schema"];

    const ajv = new Ajv({ allErrors: true, errorDataPath: 'property' });
    let invalidFields = {};

    data.forEach((resource) => {
      const valid = ajv.validate(resourceSchema, resource);
      if (!valid) {
        ajv.errors.forEach((error) => {
          // remove the "." from the beginning of the String (error.dataPath)
          const errorField = error.dataPath.substring(1);
          if (!Array.isArray(invalidFields[errorField])) {
            invalidFields[errorField] = [];
          }
          if (!invalidFields[errorField].includes(error.message)) {
            invalidFields[errorField].push(error.message);
          }
        });
      }
    });
    return invalidFields;
  }
}

module.exports = {
  ResourceValidationService
};
