"use strict";

const express = require("@feathersjs/express");
const router = express.Router();

const multiparty = require("multiparty");
const { client } = require("./storage-client.js");

const container = process.env["STORAGE_CONTAINER"] || "content-hosting";

const { promisePipe, removeTrailingSlashes } = require("./helperMethods.js");
const { FileStructureService } = require("./file_structure.service.js");
const { FileDistributionService } = require("./file_distribution.service.js");

/* ##################################################
# FILE DB HANDLING
################################################## */

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
        promisePipe(part, getUploadStream(uploadPath))
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
    return promisePipe(downloadStream, uploadStream);
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
# ROUTING
################################################## */
const hooks = require('./../content_filepaths/content_filepaths.hooks');

module.exports = function() {
  const app = this;
/*
  router.post("/upload", giveHandle_upload(app));
  router.post("/manage", giveHandle_manage(app));
  router.get("/get*", handle_download);
  //router.get("/filetree", giveHandle_filetree(app));

  router.get("/", function(req, res, next) {
    res.sendFile(path.join(__dirname + "/index.html"));
  });

  app.use("/files", router);
*/

  /* ##################################################
  # DOWNLOAD
  ################################################## */

  app.use('/files/get*', new FileDistributionService(app));
	// Get our initialize service to that we can bind hooks
	const fileDistributionService = app.service('files/get*');
  fileDistributionService.hooks(hooks); 	// Set up our hooks

  /* ##################################################
  # FILETREE
  ################################################## */

	// Initialize our service with any options it requires
	app.use('/files/structure', new FileStructureService(app));
	// Get our initialize service to that we can bind hooks
	const fileStructureService = app.service('files/structure');
	fileStructureService.hooks(hooks); 	// Set up our hooks

};
