function getPathRec(filepath, fullPath) {
  if (filepath.length == 1) {
    //Es ist eine Datei
    return {
      id: fullPath.join('/'),
      type: 'file',
      name: filepath[0]
    };
  } else {
    //Es ist ein Ordner
    let name = filepath.shift();
    let object = getPathRec(filepath, fullPath);
    fullPath.reverse();
    filepath.forEach(element => {
      fullPath.shift();
    });
    fullPath.reverse();

    let folder = {
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
  if (index === -1 || tree.type === 'file') {
    objectsArray.push(tree);
    return objectsArray;
  } else {
    if(tree.type === 'folder'){
      objectsArray[index].objects = mergeTreesRecursive(
        tree.objects[0],
        objectsArray[index].objects
      );
    }
    return objectsArray;
  }
}

class FileStructureService {
  constructor(app) {
    this.app = app;
  }

  async get(contentId, { req }) {
    console.log('GET')
    return this.app
      .service('content_filepaths')
      .find({ query: { contentId: contentId, isTemporary: false } })
      .then(response => {
        // TODO
        //if(response.total === 0){ return; }

        let fileIds = response.data[0].fileIds;
        console.log('fileIds', fileIds)

        // build trees
        let trees = [];
        fileIds.forEach(fileId => {
          let result = getPathRec(fileId.split('/'), fileId.split('/'));
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
        console.error(error);
      });
  }
}

module.exports = {
  FileStructureService
};
