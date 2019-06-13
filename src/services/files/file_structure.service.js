const logger = require('winston');

function getPathRecursive(filepathArray, fullPath, id) {
  if (filepathArray.length == 1) {
    return {
      // file
      id: id,
      type: 'file',
      name: filepathArray[0]
    };
  } else {
    // folder
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
    if (tree.type === 'folder') {
      objectsArray[index].objects = mergeTreesRecursive(
        tree.objects[0],
        objectsArray[index].objects
      );
    } else {
      logger.warn(
        'found duplicate item: ' + JSON.stringify(tree, undefined, 2)
      );
    }
    return objectsArray;
  }
}

class FileStructureService {
  constructor(app) {
    this.app = app;
  }

  async get(resourceId) {
    return this.app
      .service('resource_filepaths')
      .find({
        query: { resourceId: resourceId, isTemp: false, hidden: false},
        paginate: false
      })
      .then(publishedFiles => {
        const fileIdToPathDictionary = {};
        publishedFiles.forEach(file => {
          fileIdToPathDictionary[file._id] = file.path;
        });

        // get nested filetree per file
        const fileTrees = Object.keys(fileIdToPathDictionary).map(fileId => {
          return getPathRecursive(
            fileIdToPathDictionary[fileId].split('/'),
            fileIdToPathDictionary[fileId].split('/'),
            fileId
          );
        });

        // merge single filetrees into one
        let GlobalTree = [];
        fileTrees.forEach(tree => {
          GlobalTree = mergeTreesRecursive(tree, GlobalTree);
        });

        if (GlobalTree.length === 0) {
          throw new Error('No uploaded files found for resource ' + resourceId);
        }
        return {
          id: resourceId,
          type: 'folder',
          name: resourceId,
          objects: GlobalTree[0].objects
        };
      })
      .catch(error => {
        logger.error(error);
        return {
          id: resourceId,
          type: 'folder',
          name: resourceId,
          objects: []
        };
      });
  }
}

module.exports = {
  FileStructureService
};
