const logger = require('winston');

const getCurrentId = (filepathArray, fullPath) => {
  let idArray = fullPath.slice(0);
  filepathArray.forEach(() => {
    idArray.pop();
  });
  return idArray.join('/');
};

function getPathRecursive(filepathArray, fullPath, id, mainTreeObj) {
  if (filepathArray.length == 1) {
    return {
      // file
      id: id,
      type: 'file',
      name: filepathArray[0]
    };
  } else {
    const name = filepathArray.shift();
    let found = mainTreeObj.objects.some(element => {
      if (element.id == getCurrentId(filepathArray, fullPath)) {
        element = getPathRecursive(filepathArray, fullPath, id, element);
        return true;
      }
    });
    if (!found) {
      const object = getPathRecursive(filepathArray, fullPath, id, {
        objects: []
      });
      mainTreeObj.objects.push({
        // folder
        id: getCurrentId(filepathArray, fullPath),
        type: 'folder',
        name: name,
        objects: [object]
      });
      mainTreeObj.objects.sort((a, b) =>
        a.type === b.type
          ? a.name.localeCompare(b.name)
          : a.type === 'file'
          ? -1
          : 1
      );
    }
    return mainTreeObj;
  }
}

class FileStructureService {
  constructor(app) {
    this.app = app;
  }

  async get(contentId, { query: queryParams }) {
    if (!queryParams) {
      queryParams = {};
    }
    const queryTemp = queryParams.temp === 'true';
    const query = queryTemp
      ? { contentId: contentId, isTemp: true, userId: queryParams.userId }
      : { contentId: contentId, isTemp: false };
    return this.app
      .service('content_filepaths')
      .find({ query })
      .then(response => {
        // TODO
        const pathDictionary = {};
        response.data.forEach(data => {
          pathDictionary[data._id] = data.path;
        });
        // build tree
        let mainTreeObj = { objects: [] };
        Object.keys(pathDictionary).forEach(key => {
          mainTreeObj = getPathRecursive(
            pathDictionary[key].split('/'),
            pathDictionary[key].split('/'),
            key,
            mainTreeObj
          );
        });
        return mainTreeObj.objects;
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
