const logger = require('winston');

function getPathRecursive(filepathArray, fullPath) {
  if (filepathArray.length == 1) {
    return { // file
      id: fullPath.join('/'),
      type: 'file',
      name: filepathArray[0]
    };
  } else { // folder
    const name = filepathArray.shift();
    const object = getPathRecursive(filepathArray, fullPath);
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

  async get(contentId, { query: queryParams }) {

    if(!queryParams){
      queryParams = {};
    }

    const queryTemp = queryParams.temp === 'true';
    const query = queryTemp
      ? { contentId: contentId, isTemporary: true, userId: queryParams.userId}
      : { contentId: contentId, isTemporary: false };

    return this.app
      .service('content_filepaths')
      .find({ query })
      .then(response => {
        // TODO

        let fileIds = response.data[0].fileIds;

        if(queryTemp){
          const tmpPrefix = `tmp/${queryParams.userId}/`;
          fileIds = fileIds.map(id => id.substring(tmpPrefix.length));
        }

        // build trees
        let trees = [];
        fileIds.forEach(fileId => {
          let result = getPathRecursive(fileId.split('/'), fileId.split('/'));
          trees.push(result);
        });

        // merge trees
        let GlobalTree = [];
        trees.forEach(tree => {
          GlobalTree = mergeTreesRecursive(tree, GlobalTree);
        });

        return GlobalTree;
      })
      .catch(error => {
        logger.error(error);
        return [];
      });
  }
}

module.exports = {
  FileStructureService
};
