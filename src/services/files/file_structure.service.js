const logger = require('winston');

function getPathRecursive(filepathArray, fullPath, id) {
  if (filepathArray.length == 1) {
    return { // file
      id: id,
      type: 'file',
      name: filepathArray[0]
    };
  } else { // folder
    const name = filepathArray.shift();
    const object = getPathRecursive(filepathArray, fullPath, id);
    filepathArray.forEach(() => {
      fullPath.pop();
    });

    const folder = {
      id: fullPath.join('/'),
      type: 'folder',
      name: name,
      objects: [object]
    };
    return folder;
  }
}

function mergeTreesRecursive(tree, objectsArray) {
  let index = objectsArray.findIndex(element => {
    return element.name == tree.name;
  });
  if (index === -1) {
    objectsArray.push(tree);
    objectsArray.sort((a, b) =>
        a.type === b.type
          ? a.name.localeCompare(b.name)
          : a.type === 'file'
          ? -1
          : 1
      );
    return objectsArray;
  } else {
    if(tree.type === 'folder'){
      objectsArray[index].objects = mergeTreesRecursive(
        tree.objects[0],
        objectsArray[index].objects
      );
    }else{
      logger.warn('found duplicate item: ' + JSON.stringify(tree, undefined, 2));
    }
    return objectsArray;
  }
}

class FileStructureService {
  constructor(app) {
    this.app = app;
  }

  async get(resourceId) {
    const query = { resourceId: resourceId, isTemp: false };
    return this.app
      .service('resource_filepaths')
      .find({ paginate: false, query })
      .then(response => {
        // TODO
        const pathDictionary = {};
        response.forEach(data => {
          pathDictionary[data._id] = data.path;
        });
        // build trees
        let trees = [];
        Object.keys(pathDictionary).forEach(key => {
          let result = getPathRecursive(pathDictionary[key].split('/'), pathDictionary[key].split('/'), key);
          trees.push(result);
        });

        // merge trees
        let GlobalTree = [];
        trees.forEach(tree => {
          GlobalTree = mergeTreesRecursive(tree, GlobalTree);
        });
        return GlobalTree.length ? GlobalTree[0]: { id: resourceId, type: 'folder', objects: []};
      })
      .catch(error => {
        logger.error(error);
        return { id: resourceId, type: 'folder', objects: []};
      });
  }
}

module.exports = {
  FileStructureService
};
