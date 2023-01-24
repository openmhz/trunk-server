var db = require('../db');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var sysStats = require("../sys_stats");
var probe = require('node-ffprobe');
var mongoose = require("mongoose");
var System = require("../models/system");
var Talkgroup = require("../models/talkgroup");
var Group = require("../models/group");
var {callModel:Call} = require("../models/call");
var secrets = require("../config/secrets");
var util = require("util")
var config = require('../config/config.json');

var s3_endpoint = process.env['S3_ENDPOINT'] != null ? process.env['S3_ENDPOINT'] : 's3.us-west-1.wasabisys.com';
var s3_bucket = process.env['S3_BUCKET'] != null ? process.env['S3_BUCKET'] : 'openmhz-west';
var s3_profile = process.env['S3_PROFILE'] != null ? process.env['S3_PROFILE'] : 'wasabi-account';

const wasabi = require('aws-sdk');

const wasabiEndpoint = new wasabi.Endpoint(s3_endpoint);
var wasabiCredentials = new wasabi.SharedIniFileCredentials({
  profile: s3_profile
});
wasabi.config.credentials = wasabiCredentials;
const wasabiS3 = new wasabi.S3({
  endpoint: wasabiEndpoint,
  maxRetries: 0
});

async function callLength(file) {

  return new Promise((resolve, reject) => {
    probe(file, function (err, probeData) {
      if (err) {
        reject(err);
      } else {
        resolve(Math.round(probeData.format.duration));
      }
    });
  })
}

exports.upload = function (req, res, next) {
  process.nextTick(function () {



    /** When using the "single"
        data come in "req.file" regardless of the attribute "name". **/
    var tmp_path = req.file.path;

    /** The original name of the uploaded file
        stored in the variable "originalname". **/
    var target_path = 'uploads/' + req.file.originalname;

    if (!req.file && (path.extname(req.file.originalname)) != '.m4a') {
      console.warn("[" + req.params.shortName + "] Error file name is wrong or file does not exist");
      res.status(500);
      res.send("Error, invalid filename:\n");
      return;
    }
    var shortName = req.params.shortName.toLowerCase();
    var apiKey = req.body.api_key;



    System.findOne({
      'shortName': shortName
    }, ["key", "ignoreUnknownTalkgroup"], async function (err, item) {

      if (err) {
        console.warn("[" + req.params.shortName + "] Error /:shortName/upload - Error: " + err);
        res.status(500);
        res.send("Error, invalid shotName:\n" + err);
        return;
      }
      if (item === null) {
        console.warn("[" + req.params.shortName + "] Error /:shortName/upload ShortName does not exist");
        res.status(500);
        res.send("ShortName does not exist: " + shortName + "\n");
        return;
      }
      if (apiKey != item.key) {
        console.warn("[" + req.params.shortName + "] Error /:shortName/upload API Key Mismatch - Provided key: " + apiKey);
        res.status(500);
        res.send("API Keys do not match!\n");
        return;
      }

      var talkgroupNum = parseInt(req.body.talkgroup_num);
      var freq = parseFloat(req.body.freq);
      var time = new Date(parseInt(req.body.start_time) * 1000);
      var stopTime = new Date();
      if (req.body.stop_time) {
        var stopTime = new Date(parseInt(req.body.stop_time) * 1000);
      }
      var startTime = req.body.start_time;
      var emergency = parseInt(req.body.emergency);


      if (item.ignoreUnknownTalkgroup == true) {
        //console.log("ignore unknown talkgroup ");
        //await Talkgroup.findOne({ answer: 42 }).select({ _id: 1 }).lean().then(doc => !!doc)
        talkgroupExists = await Talkgroup.exists({
          'shortName': shortName,
          'num': talkgroupNum
        });
        //console.log("In talkgroup: " + talkgroupExists);
        //talkgroupExists = await Talkgroup.findOne({ 'shortName': shortName,  'num': talkgroupNum }).select({ _id: 1 }).lean().then(doc => !!doc).exec();
        if (!talkgroupExists) {
          try {
            fs.unlinkSync(req.file.path)
            //file removed
          } catch (err) {
            console.log("[" + call.shortName + "] error deleting: " + req.file.path);
          }

          res.status(500);
          res.send("Talkgroup does not exist, skipping.\n");
          return;

        }
      }
      // Add in an API Key check

      try {

        var srcList = JSON.parse(req.body.source_list);

        // Mongoose does not allow 'errors' to be used in the Schema for call. need to rename to error.
        var badFreqList = JSON.parse(req.body.freq_list);
        var freqList = badFreqList.map(obj => {
          obj.error = obj.errors;
          delete obj.errors;
          return obj;
        });

      } catch (err) {
        var srcList = [];
        var freqList = [];
        console.warn("[" + req.params.shortName + "] Error /:shortName/upload Parsing Source/Freq List -  Error: " + err);

        res.status(500);
        res.send("Error parsing sourcelist " + err);
      }

      var base_path = config.mediaDirectory;
      var local_path = "/" + shortName + "/" + time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate() + "/";
      var target_file = base_path + local_path + path.basename(req.file.originalname);
      var object_key = "media/" + shortName + "-" + talkgroupNum + "-" + startTime + ".m4a";

      var endpoint = s3_endpoint;
      var bucket = s3_bucket;


      // If not a pro plan, use S3 storage
      var url = 'https://' + s3_endpoint + "/" + s3_bucket + "/" + object_key;
      var objectStore = true;


      var call = new Call({
        shortName: shortName,
        talkgroupNum: talkgroupNum,
        objectKey: object_key,
        endpoint: endpoint,
        bucket: bucket,
        time: time,
        name: talkgroupNum + "-" + startTime + ".m4a",
        freq: freq,
        url: url,
        emergency: emergency,
        path: local_path,
        srcList: srcList,
        freqList: freqList,
        len: -1
      });

      try {
        if (req.body.call_length) {
          call.len = parseInt(req.body.call_length);
        } else {
          call.len = (stopTime - time) / 1000; //await callLength(req.file.path);
        }
        res.status(200).end();


        if (!objectStore) {
          mkdirp.sync(base_path + local_path, function (err) {
            if (err) console.error(err);
          });
          var src = fs.createReadStream(req.file.path);
          var dest = fs.createWriteStream(target_file);
          dest.on('unpipe', (src) => {
            src.end();
            dest.end();
          });
          src.pipe(dest);
          src.unpipe()
          src.on('error', function (err) {
            console.warn("[" + call.shortName + "] Error /:shortName/upload copying to location - Error: " + err + " Read: " + req.file.path + " Target: " + target_file);
            fs.unlink(req.file.path, (err) => {
              if (err)
                console.log("[" + call.shortName + "] error deleting: " + req.file.path);
            });
            res.contentType('json');
            res.send(JSON.stringify({
              success: false,
              error: "Upload failed"
            }));
          });
          src.on('end', function () {
            fs.unlink(req.file.path);
          });
        } else {
          //var spacesSrc = fs.createReadStream(req.file.path);
          //var awsSrc = fs.createReadStream(req.file.path);
          var wasabiSrc = fs.createReadStream(req.file.path);

          // call S3 to retrieve upload file to specified bucket

          /*  var spacesParams = {Bucket: 'openmhz', Key: object_key, Body: spacesSrc, ACL: 'public-read'};
            // call S3 to retrieve upload file to specified bucket
            spacesS3.upload (spacesParams, function (err, data) {
              //fs.unlink(req.file.path);
              if (err) {
                console.log("Spaces Error", err);
              }
            });*/
          /*
          var awsParams = {Bucket: 'openmhz', Key: object_key, Body: awsSrc, ACL: 'public-read'};

          awsS3.upload (awsParams, function (err, data) {
            fs.unlink(req.file.path);
            if (err) {
              console.log("AWS Error", err);
            }
          });*/

          var wasabiParams = {
            Bucket: s3_bucket,
            Key: object_key,
            Body: wasabiSrc,
            ACL: 'public-read'
          };


          //var options = {partSize: 10 * 1024 * 1024, queueSize: 1};
          /*var upload = new wasabiS3.ManagedUpload({
            leavePartsOnError: true,
            partSize: 10 * 1024 * 1024, queueSize: 1,
            params: wasabiParams
          });*/
          //wasabiS3.upload(wasabiParams, options, function(err, data) {
          wasabiS3.upload(wasabiParams, function (err, data) {
            wasabiSrc.destroy();
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.log("[" + call.shortName + "]error deleting: " + req.file.path);
              }
              call.save();
              sysStats.addCall(call.toObject());

              // we only want to notify clients if the clip is longer than 1 second.
              if (call.len >= 1) {
                req.call = call.toObject();
                next();
              }
            });
            if (err) {
              console.log("[" + call.shortName + "] " + call.name + " -   content-length: " + req.headers['content-length'] + " Wasabi Error", err);
            }
          });
        }
      } catch (err) {
        console.warn("[" + call.shortName + "] Upload Error: " + err + " Filename: " + call.name + " content-length: " + req.headers['content-length']);
        res.status(500);
        sysStats.addError(call.toObject());
        res.contentType('json');
        res.send(JSON.stringify({
          success: false,
          error: "FFProbe"
        }));
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.log("error deleting: " + req.file.path);
        });
      }



    });
  });
}
