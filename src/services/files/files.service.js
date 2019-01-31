"use strict";

const express = require("@feathersjs/express");
const router = express.Router();

const multiparty = require("multiparty");
const path = require("path");
const { client } = require("./storage-client.js");
const mime = require('mime-types')

const container = process.env["STORAGE_CONTAINER"] || "content-hosting";

function PromisePipe(source, target){
  return new Promise((resolve, reject) => {
    source.pipe(target)
    .on("success", function(result) {
      return resolve(result);
    })
    .on("error", function(error) {
      return reject(error);
    });
  });
}

function removeTrailingSlashes(filePath){
  // remove trailing slashes and dots
  return filePath.replace(/^[\/\.]*/, "");
}



/* ##################################################
# UPLOAD
################################################## */

function getUploadStream(filePath) {
  return client.upload({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: filePath
  });
}

function handle_upload(req, res, next) {
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
        return res.sendStatus(200);
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

function handle_manage(req, res, next) {
  const removeOperations = (req.body.delete || []).map((sourcePath) => {
    const filePath = removeTrailingSlashes(sourcePath);
    return removeFile(filePath);
  });
  const moveOperations = (req.body.save || []).map((sourcePath) => {
    const filePath = removeTrailingSlashes(sourcePath);
    return moveFile("/tmp/u-id/" + filePath, filePath);
  });
  return Promise.all([...removeOperations, ...moveOperations])
    .then(() =>{
      res.sendStatus(200);
    }).catch((error) => {
      if(error.statusCode){
        res.sendStatus(error.statusCode);
      }
      res.sendStatus(500);
    });
}



/* ##################################################
# ROUTING
################################################## */

module.exports = function() {
  const app = this;

  router.post("/upload", handle_upload);
  router.post("/manage", handle_manage);
  router.get("/get*", handle_download);

  router.get("/", function(req, res, next) {
    res.sendFile(path.join(__dirname + "/index.html"));
  });

  app.use("/files", router);
};
