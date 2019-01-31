"use strict";

const express = require("@feathersjs/express");
const router = express.Router();

const multiparty = require("multiparty");
const path = require("path");
const { client } = require("./storage-client.js");

const container = process.env["STORAGE_CONTAINER"] || "content-hosting";

/* ##################################################
# UPLOAD
################################################## */

function uploadStream({ stream, path, res }) {
  const writableStream = client.upload({
    queueSize: 1, // == default value
    partSize: 5 * 1024 * 1024, // == default value of 5MB
    container: container,
    remote: path
  });

  //writableStream.managedUpload === https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3/ManagedUpload.html
  // managedUpload object allows you to abort ongoing upload or track file upload progress.

  stream
    .pipe(writableStream)
    .on("success", function(file) {
      console.log("Success:"); //, file);
      return res.sendStatus(200);
    })
    .on("error", function(err) {
      console.error("Error:", err);
      return res.sendStatus(err.statusCode);
    });
}

function handle_upload(req, res, next) {
  // TODO permission check, content-id must be owned by current user, ...
  // TODO prefix with content-id from query-string
  const uploadPath = req.query.path.replace(/^\/*/, "");
  const form = new multiparty.Form();
  form.on("part", part => {
    if (part.filename && uploadPath) {
      uploadStream({
        stream: part,
        path: uploadPath,
        res
      });
    }else{
      return res.sendStatus(400);
    }
  });
  form.parse(req);
}

/* ##################################################
# DOWNLOAD
################################################## */

// TODO permission check

// TODO FIX, sends `function file() { [native code] }` instead of file
// Problem is during upload!

function result(res, filePath) {
  return (error /*, file*/) => {
    if (error != null) {
      res.status(error.statusCode);
      res.json(error);
      return error;
    }
    client
      .download(
        {
          container: container,
          remote: filePath
        },
        result
      )
      .pipe(res);
  };
}

function handle_download(req, res) {
  const filePath = req.params["0"].replace(/^\//, "");
  // check if file exists to prevent crash during download
  return client.getFile(container, filePath, result(res, filePath));
}

/* ##################################################
# PERSIST
################################################## */

// TODO

/* ##################################################
# ROUTING
################################################## */

module.exports = function() {
  const app = this;

  router.post("/upload", handle_upload);
  router.get("/get*", handle_download);

  router.get("/", function(req, res, next) {
    res.sendFile(path.join(__dirname + "/index.html"));
  });

  app.use("/files", router);
};
