function addFileToDB(app, sourcePath){
  let data = {
    filesIds: sourcePath,
    contentId: Math.floor(Math.random()*1000000)+1, // returns a random integer from 1 to 1.000.000
    userId: '73632d636f6e74656e742d31', // Hardcoded UserID of User: 'schulcloud-content-1'
    isTemporary: true}
  return app.service('content_filepaths').create(data);
}

/*
Paths: [
  {from "tmp/abc", to: "abc"}
  {from "tmp/abc", to: "abc"}
  ...
]
*/
function moveFileWithinDB(app, paths, contentId = 'htrshjtzjdz5'){
  console.log("moveFileWithinDB");
  //1. SEARCH FOR NOT TEMP FILE STRUCT and insert paths.to
  const insertPromise = app.service('content_filepaths').find({query: {contentId: contentId, isTemporary: false}}).then((response) => {
    if(response.data.length != 1){
      throw new Error('Es existiert mehr als ein Object mit der eigenschaft isTemporary=false für die contentId:'+contentId);
    }
    var recivedpaths = [];
    for(path in paths){
      recivedpaths.push(path.to)
    }
    var oldPaths = response.data[0].filesIds;
    var newPaths = recivedpaths.filter(item => {return oldPaths.indexOf(item) == -1;})
    var newPaths = oldPaths.concat(newPaths);
    return app.service('content_filepaths').patch(response.data[0]._id, {filesIds: newPaths});
  })
  //1. SEARCH FOR TEMP FILE STRUCT TO DELETE paths.from

  deletePromise = app.service('content_filepaths').find({query: {contentId: contentId, isTemporary: true, userId: '73632d636f6e74656e742d31'}}).then(response => {
  const removeList = response.data.map((entry) => {
    return app.service('content_filepaths').remove(entry._id);
  });
  return Promise.all(removeList);
});

 return Promise.all([insertPromise, deletePromises]);
}


function removeFileFromDB(app,sourcePath, contentId = 'htrshjtzjdz5'){
 return app.service('content_filepaths').find({query: {contentId: contentId, filesIds: sourcePath}}).then((response) => {
    let newFileIds = response.data[0].filesIds
    newFileIds.splice(newFileIds.indexOf(sourcePath), 1);
    if(newFileIds.length == 0){
      return app.service('content_filepaths').remove(response.data[0]._id);
    }else{
      return app.service('content_filepaths').patch(response.data[0]._id, {filesIds: newFileIds});
    }
  }).catch(error => {
    if(error instanceof TypeError){
      console.log("Type Error !")
    }else{
      console.log("No type error ?")
    }
    console.log(error);
  });
}

module.exports = {
  addFileToDB,
  moveFileWithinDB,
  removeFileFromDB
};
