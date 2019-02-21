function getPathRec(path, fullPath) {
  if (path.length == 1) {
    //Es ist eine Datei
    return {
      id: fullPath.join("/"),
      type: "file",
      name: path[0]
    };
  } else {
    //Es ist ein Ordner
    let name = path.shift();
    let object = getPathRec(path, fullPath);
    fullPath.reverse();
    path.forEach(element => {
      fullPath.shift();
    });
    fullPath.reverse();

    let folder = {
      id: fullPath.join("/"),
      type: "folder",
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
  if (index == -1) {
    objectsArray.push(tree);
    return objectsArray;
  } else {
    objectsArray[index].objects = mergeTreesRecursive(
      tree.objects[0],
      objectsArray[index].objects
    );
    return objectsArray;
  }
}

function getFileStructure(app, sourcePath = "", contentId = "mycid1111") {
  return app
    .service("content_filepaths")
    .find({ query: { contentId: contentId, isTemporary: false } })
    .then(response => {
      let fileIds = response.data[0].filesIds;

      // build trees
      let trees = [];
      fileIds.forEach(fileId => {
        let result = getPathRec(fileId.split("/"), fileId.split("/"));
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

class FileStructureService {
  constructor(app) {
    this.app = app;
  }

  async get(id, { req }) {
    // TODO use correct content id
    console.log("Body:", req.body);
    const data = await getFileStructure(this.app);
    return data; // same as `return req.res.data = data;`
  }
}

module.exports = {
  FileStructureService
};
