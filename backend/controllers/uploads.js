var path = require('path');
var fs = require('fs');
const opentelemetry = require('@opentelemetry/api');

var { context, propagation, trace } = require('@opentelemetry/api');
var sysStats = require("../sys_stats");
var System = require("../models/system");
var Talkgroup = require("../models/talkgroup");
var { callModel: Call } = require("../models/call");


const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");

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

  const tracer = trace.getTracer('upload-tracer');


  process.nextTick(async () => {
    if (!req.file || ((path.extname(req.file.originalname) != '.m4a') && (path.extname(req.file.originalname) != '.mp3'))) {
      console.warn("[" + req.params.shortName + "] Error file name is wrong or file does not exist");
      res.status(500);
      res.send("Error, invalid filename:\n");
      return;
    }
    var shortName = req.params.shortName.toLowerCase();
    var apiKey = req.body.api_key;
    var talkgroupNum = parseInt(req.body.talkgroup_num);
    var freq = parseFloat(req.body.freq);
    var time = new Date(parseInt(req.body.start_time) * 1000);
    var stopTime = new Date();
    if (req.body.stop_time) {
      var stopTime = new Date(parseInt(req.body.stop_time) * 1000);
    }
    var startTime = req.body.start_time;
    var emergency = parseInt(req.body.emergency);

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

    let item = null;
    const ctx = propagation.setBaggage(
      context.active(),
      propagation.createBaggage({
        for_the_children: { shortName: shortName, talkgroupNum: talkgroupNum, startTime: startTime },
      }),
    );

    // Validate that the system exists and the API key is correct
    context.with(ctx, () => {
      tracer.startActiveSpan('validate-system', async (span) => {
        try {
          item = await System.findOne({ 'shortName': shortName }, ["key", "ignoreUnknownTalkgroup"]);
        } catch (err) {
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Error /:shortName/upload - Error: " + err,
          });
          console.warn("[" + req.params.shortName + "] Error /:shortName/upload - Error: " + err);
          res.status(500);
          res.send("Error, invalid shortName:\n" + err);
          span.end();
          return;
        }

        if (!item) {
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Error /:shortName/upload API Key Mismatch - Provided key: " + apiKey,
          });
          console.info("[" + req.params.shortName + "] Error /:shortName/upload ShortName does not exist");
          res.status(500);
          res.send("ShortName does not exist: " + shortName + "\n");
          span.end();
          return;
        }
        if (apiKey != item.key) {
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Error /:shortName/upload API Key Mismatch - Provided key: " + apiKey,
          });
          console.warn("[" + req.params.shortName + "] Error /:shortName/upload API Key Mismatch - Provided key: " + apiKey);
          res.status(500);
          res.send("API Keys do not match!\n");
          span.end();
          return;
        }

        // Blocking sensitive talkgroups
        if ((shortName == "hennearmer") && ((talkgroupNum == 3421) || (talkgroupNum == 3423))) {
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Sensitive Talkgroup",
          });
          res.status(200).end();
          span.end();
          return;
        }

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
            span.setStatus({
              code: opentelemetry.SpanStatusCode.ERROR,
              message: "Ignore Unknown Talkgroup Set - Talkgroup does not exist: " + talkgroupNum + " ShortName: " + shortName,
            });
            span.end();
            return;
          }
        }
        // Add in an API Key check



        res.status(200).end();
        span.end();
      });
    });

    var local_path = "/" + shortName + "/" + time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate() + "/";
    var object_key = "media/" + shortName + "-" + talkgroupNum + "-" + startTime + path.extname(req.file.originalname);

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

    // Upload the file to S3
    context.with(ctx, () => {
      tracer.startActiveSpan('upload-call', async (span) => {
        try {
          if (req.body.call_length) {
            call.len = parseFloat(req.body.call_length);
          } else {
            call.len = (stopTime - time) / 1000;
          }
        } catch (err) {
          console.error(err);
        }
        let fileContent;
        try {
          fileContent = fs.readFileSync(req.file.path);
          //s3Src = fs.createReadStream(req.file.path);
        } catch (err) {
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Unable to open file: " + req.file.path + " Error: " + err,
          });
          span.end();
          console.error("[" + call.shortName + "] Unable to open file: " + req.file.path + " Error: " + err);
          return;
        }
        const command = new PutObjectCommand({
          Bucket: s3_bucket,
          Key: object_key,
          Body: fileContent,
          ACL: 'public-read'
        });

        try {
          await client.send(command);

        } catch (err) {
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Upload Error: " + err + " Filename: " + call.name + " content-length: " + req.headers['content-length'] + " Key: " + object_key + " Bucket: " + s3_bucket,
          });
          console.warn("[" + call.shortName + "] Upload Error: " + err + " Filename: " + call.name + " content-length: " + req.headers['content-length'] + " Key: " + object_key + " Bucket: " + s3_bucket);
          /*res.status(500);
          sysStats.addError(call.toObject());
          res.contentType('json');
          res.status(500);
          res.send(JSON.stringify({
            success: false,
            error: "File Upload"
          }));*/
        }
        span.end();
      });
    });

    // Save Call to the database
    context.with(ctx, () => {
      tracer.startActiveSpan('save-call', async (span) => {
        try {
          await call.save();
          sysStats.addCall(call.toObject());
          // we only want to notify clients if the clip is longer than 1 second.
          if (call.len >= 1) {
            req.call = call.toObject();
            next();
          }
        } catch (err) {
          console.warn("[" + call.shortName + "] Error saving call: " + err);
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Error saving call: " + err,
          });
          /*res.status(500);
          sysStats.addError(call.toObject());
          res.contentType('json');
          res.status(500);
          res.send(JSON.stringify({
            success: false,
            error: "File Upload"
          }));*/
        }

        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.warn("There was an Error uploading an deleting: " + req.file.path);
        };

        span.end();
      });
    });
  });



}
