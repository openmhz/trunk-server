var path = require('path');
var fs = require('fs');
var sysStats = require("../sys_stats");
var System = require("../models/system");
var Talkgroup = require("../models/talkgroup");
var { callModel: Call } = require("../models/call");

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const {fromIni} = require("@aws-sdk/credential-providers");

var s3_endpoint = process.env['S3_ENDPOINT'] != null ? process.env['S3_ENDPOINT'] : 'https://s3.us-west-1.wasabisys.com';
var s3_region = process.env['S3_REGION'] != null ? process.env['S3_REGION'] : 'us-west-1';
var s3_bucket = process.env['S3_BUCKET'] != null ? process.env['S3_BUCKET'] : 'openmhz-west';
var s3_profile = process.env['S3_PROFILE'] != null ? process.env['S3_PROFILE'] : 'wasabi-account';


const client = new S3Client({
  credentials: fromIni({ profile: s3_profile }),
  endpoint: s3_endpoint,
  region: s3_region,
  maxAttempts: 1
});

exports.upload = async function (req, res, next) {

  if (!req.file && (path.extname(req.file.originalname)) != '.m4a') {
    console.warn("[" + req.params.shortName + "] Error file name is wrong or file does not exist");
    res.status(500);
    res.send("Error, invalid filename:\n");
    return;
  }
  var shortName = req.params.shortName.toLowerCase();
  var apiKey = req.body.api_key;
  let item = null;

  try {
    item = await System.findOne({ 'shortName': shortName }, ["key", "ignoreUnknownTalkgroup"]);
  } catch (err) {
    console.warn("[" + req.params.shortName + "] Error /:shortName/upload - Error: " + err);
    res.status(500);
    res.send("Error, invalid shotName:\n" + err);
    return;
  }

  if (!item) {
    console.info("[" + req.params.shortName + "] Error /:shortName/upload ShortName does not exist");
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
    talkgroupExists = await Talkgroup.exists({
      'shortName': shortName,
      'num': talkgroupNum
    });

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

  let errorCount = parseInt(req.body.error_count);
  let spikeCount = parseInt(req.body.spike_count);

  if (Number.isNaN(errorCount)) {
    errorCount = 0;
  }
  if (Number.isNaN(spikeCount)) {
    spikeCount = 0;
  }

  try {
    var srcList = JSON.parse(req.body.source_list);
  } catch (err) {
    var srcList = [];
    console.warn("[" + req.params.shortName + "] Error /:shortName/upload Parsing Source/Freq List -  Error: " + err);
    res.status(500);
    res.send("Error parsing sourcelist " + err);
    return;
  }

  res.status(200).end();

  var local_path = "/" + shortName + "/" + time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate() + "/";
  var object_key = "media/" + shortName + "-" + talkgroupNum + "-" + startTime + ".m4a";

  var endpoint = s3_endpoint;
  var bucket = s3_bucket;
  var url = s3_endpoint + "/" + s3_bucket + "/" + object_key;

  var call = new Call({
    shortName: shortName,
    talkgroupNum: talkgroupNum,
    objectKey: object_key,
    endpoint: endpoint,
    bucket: bucket,
    time: time,
    name: talkgroupNum + "-" + startTime + ".m4a",
    freq: freq,
    errorCount: errorCount,
    spikeCount: spikeCount,
    url: url,
    emergency: emergency,
    path: local_path,
    srcList: srcList,
    len: -1
  });

  try {
    if (req.body.call_length) {
      call.len = parseFloat(req.body.call_length);
    } else {
      call.len = (stopTime - time) / 1000;
    }
  } catch (err) {
    console.error(err);
  }

  var s3Src = fs.createReadStream(req.file.path);

  const command = new PutObjectCommand({
    Bucket: s3_bucket,
    Key: object_key,
    Body: s3Src,
    ACL: 'public-read'
  });

  try {
    await client.send(command);

    s3Src.destroy();
    fs.unlink(req.file.path, async (err) => {
      if (err) {
        console.error("[" + call.shortName + "]error deleting: " + req.file.path);
      }
      await call.save();
      sysStats.addCall(call.toObject());

      // we only want to notify clients if the clip is longer than 1 second.
      if (call.len >= 1) {
        req.call = call.toObject();
        next();
      }
    });
  } catch (err) {
    console.warn("[" + call.shortName + "] Upload Error: " + err + " Filename: " + call.name + " content-length: " + req.headers['content-length'] + " Key: " + object_key + " Bucket: " + s3_bucket);
    /*res.status(500);
    sysStats.addError(call.toObject());
    res.contentType('json');
    res.status(500);
    res.send(JSON.stringify({
      success: false,
      error: "File Upload"
    }));*/
    fs.unlink(req.file.path, (err) => {
      if (err)
        console.log("error deleting: " + req.file.path);
    });
  }
}
