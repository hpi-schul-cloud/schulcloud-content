const resourceSchema = require('../../hooks/validate-resource-schema/resource-schema.json');

class ResourceSchemaService {
  constructor(app) {
    this.app = app;
  }

  async find() {
    return resourceSchema;
  }
}

module.exports = {
    ResourceSchemaService
};
