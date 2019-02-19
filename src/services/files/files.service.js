"use strict";

const express = require("@feathersjs/express");
const router = express.Router();

const multiparty = require("multiparty");
const path = require("path");
const { client } = require("./storage-client.js");
const mime = require('mime-types');

const container = process.env["STORAGE_CONTAINER"] || "content-hosting";

function PromisePipe(source, target){
  return new Promise((resolve, reject) => {
    source.pipe(target)
    .on("success", (result) => {
      return resolve(result);
    })
    .on("error", (error) => {
      return reject(error);
    });
  });
}

function removeTrailingSlashes(filePath){
  // remove trailing slashes and dots
  return filePath.replace(/^[\/\.]*/, "");
}

function addIsPublishFlag(app){
  return app.service('resources').find({query: {$limit: false}}).then(response => {
    const patchList = response.data.map((entry) => {
      return app.service('resources').patch(entry._id, {isPublished: true});
    });
    return Promise.all(patchList);
  });
}

/* ##################################################
# FILE DB HANDLING
################################################## */

function addFileToDB(app, sourcePath){
  let data = {
    filesIds: sourcePath,
    contentId: Math.floor(Math.random()*1000000)+1, // returns a random integer from 1 to 1.000.000
    userId: '73632d636f6e74656e742d31', // Hardcoded UserID of User: 'schulcloud-content-1'
    isTemporary: true}
  return app.service('file_structure').create(data);

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
  const insertPromise = app.service('file_structure').find({query: {contentId: contentId, isTemporary: false}}).then((response) => {
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
    return app.service('file_structure').patch(response.data[0]._id, {filesIds: newPaths});
  })
 //1. SEARCH FOR TEMP FILE STRUCT TO DELETE paths.from

 deletePromise = app.service('file_structure').find({query: {contentId: contentId, isTemporary: true, userId: '73632d636f6e74656e742d31'}}).then(response => {
  const removeList = response.data.map((entry) => {
    return app.service('file_structure').remove(entry._id);
  });
  return Promise.all(removeList);
});

 return Promise.all([insertPromise, deletePromises]);
}


function removeFileFromDB(app,sourcePath, contentId = 'htrshjtzjdz5'){
 return app.service('file_structure').find({query: {contentId: contentId, filesIds: sourcePath}}).then((response) => {
    let newFileIds = response.data[0].filesIds
    newFileIds.splice(newFileIds.indexOf(sourcePath), 1);
    if(newFileIds.length == 0){
      return app.service('file_structure').remove(response.data[0]._id);
    }else{
      return app.service('file_structure').patch(response.data[0]._id, {filesIds: newFileIds});
    }
  }).catch(error => {
    if(error instanceof TypeError){
      console.log("Type Error !")
    }else{
      console.log("No type error ?")
    }
    console.log(error);
  }

  );
 
}



/* ##################################################
# UPLOAD
################################################## */
function giveHandle_upload(app){
  return(req,res,next) => {
    // TODO permission check, content-id must be owned by current user, ...
    // TODO prefix with content-id from query-string
    // TODO prefix with tmp/user-id
    const uploadPath = removeTrailingSlashes(req.query.path);
    const form = new multiparty.Form();
    form.on("part", part => {
      if (part.filename && uploadPath) {
        //writableStream.managedUpload === https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3/ManagedUpload.html
        // managedUpload object allows you to abort ongoing upload or track file upload progress.
        PromisePipe(part, getUploadStream(uploadPath))
        .then((result) => {
          return addFileToDB(app, uploadPath).then(()=> {
            return res.send(uploadPath);
          }).catch(error => {
            throw error;
          });
        }).catch(error => {
          if(error.statusCode){
            return res.sendStatus(error.statusCode);
          }
          return res.sendStatus(400);
        });
      } else {
        return res.sendStatus(400);
      }
    });
    form.parse(req);
  }
}

function getUploadStream(filePath) {
  return client.upload({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}



/* ##################################################
# DOWNLOAD
################################################## */

// TODO permission check

function fileExists(filePath) {
  return new Promise((resolve, reject) => {
    return client.getFile(container, filePath, (error, file) => {
      if (error !== null) { return reject(error); }
      return resolve(file);
    });
  });
}

function getDownloadStream(filePath) {
  return client.download({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}

async function handle_download(req, res) {
  const filePath = req.params["0"].replace(/^\//, "");
  // check if file exists to prevent crash during download
  try{
    const fileInfo = await fileExists(filePath);
    const contentType = mime.contentType(path.extname(fileInfo.name)) // 'application/json; charset=utf-8'

    if(contentType){   res.header("Content-Type", contentType); }
    if(fileInfo.etag){ res.header("ETag", fileInfo.etag); }

    return PromisePipe(getDownloadStream(filePath), res);
  }catch(error){
    // send error?
    return res.sendStatus(404);
  }
}



/* ##################################################
# PERSIST
################################################## */

async function moveFile(from, to) {
  try{
    await fileExists(from);
    const downloadStream = getDownloadStream(from);
    const uploadStream = getUploadStream(to);
    return PromisePipe(downloadStream, uploadStream);
  }catch(error){
    res.sendStatus(404);
  }
}


function removeFile(filePath) {
  return new Promise((resolve, reject) => {
    return client.removeFile(container, filePath, (error) => {
      if (error !== null) { return reject(error); }
      return resolve();
    });
  });
}
function giveHandle_manage(app){
  return(req,res,next) => {
    const tmpPrefix = "/tmp/u-id/";
    const deleteOperations = (req.body.delete || []);
    const moveOperations = (req.body.save || []);

 
    const deletePromises = deleteOperations.map((sourcePath) => {
      const filePath = removeTrailingSlashes(sourcePath);
      return removeFile(filePath);
    });
    const movePromises = moveOperations.map((sourcePath) => {
      const filePath = removeTrailingSlashes(sourcePath);
      return moveFile(tmpPrefix + filePath, filePath);
    });
    return Promise.all([...deletePromises, ...movePromises])
      .then(() =>{
        deleteOperations.forEach((sourcePath) => {
          removeFileFromDB(app, sourcePath)
        })
        moveOperations.forEach((sourcePath) => {
          moveFileWithinDB(app, {from: (tmpPrefix + sourcePath), to: sourcePath})
        })
        res.sendStatus(200);
      }).catch((error) => {
        if(error.statusCode){
          res.sendStatus(error.statusCode);
        }
        res.sendStatus(500);
      });
  }
}

/* ##################################################
# FILETREE
################################################## */

function getPathRec(path,fullPath){
  if(path.length == 1){
    //Es ist eine Datei
      return {
      id: fullPath.join('/'),
      type: 'file',
      name: path[0]
    }
  } else{
    //Es ist ein Ordner
    let name = path.shift()
    let object = getPathRec(path,fullPath)
    fullPath.reverse()
    path.forEach(element => {
      fullPath.shift()
    });
    fullPath.reverse()

    let folder = {
      id: fullPath.join('/'),
      type: 'folder',
      name: name,
      objects: [object]
    }
    return folder
  }
}

function mergeTreesRecursive(tree, objectsArray) {
  let index = objectsArray.findIndex((element)=>{
    return element.name == tree.name
  });
  if (index == -1) {
    objectsArray.push(tree);
    return objectsArray
  } else {
    objectsArray[index].objects = mergeTreesRecursive(tree.objects[0], objectsArray[index].objects);
    return objectsArray
  }
}


function getFileStructure(app,sourcePath='', contentId = 'mycid1111'){
  return app.service('file_structure').find({query: {contentId: contentId, isTemporary: false}}).then((response) => {
    let fileIds = response.data[0].filesIds

    // build trees
    let trees = []
    fileIds.forEach((fileId) => {
      let result = (getPathRec(fileId.split('/'),fileId.split('/')));
      trees.push(result);
    });

    // merge trees
    let GlobalTree = []
    trees.forEach((tree)=>{
      GlobalTree = mergeTreesRecursive(tree, GlobalTree)
    })

    return GlobalTree;

  }).catch(error => {
    console.error(error)
  }
  );
}

function giveHandle_filetree(app){
  return async (req,res,next) => {
    return res.json(await getFileStructure(app));
  }
}

/* ##################################################
# ROUTING
################################################## */

module.exports = function() {
  const app = this;

  router.post("/upload", giveHandle_upload(app));
  router.post("/manage", giveHandle_manage(app));
  router.get("/get*", handle_download);
  router.get("/filetree", giveHandle_filetree(app));

  router.get("/", function(req, res, next) {
    res.sendFile(path.join(__dirname + "/index.html"));
  });

  app.use("/files", router);
};
