var path = require('path');
var fs = require('fs');
const opentelemetry = require('@opentelemetry/api');
var sysStats = require("../sys_stats");
var System = require("../models/system");
var Talkgroup = require("../models/talkgroup");
var { callModel: Call } = require("../models/call");
const { trace } = opentelemetry;

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const https = require('https');

const agent = new https.Agent({
  maxSockets: 250
});


var s3_endpoint = process.env['S3_ENDPOINT'] != null ? process.env['S3_ENDPOINT'] : 'https://s3.us-west-1.wasabisys.com';
var s3_region = process.env['S3_REGION'] != null ? process.env['S3_REGION'] : 'us-west-1';
var s3_bucket = process.env['S3_BUCKET'] != null ? process.env['S3_BUCKET'] : 'openmhz-west';
var s3_profile = process.env['S3_PROFILE'] != null ? process.env['S3_PROFILE'] : 'wasabi-account';
var s3_public_url = process.env['S3_PUBLIC_URL'] != null ? process.env['S3_PUBLIC_URL'] : s3_endpoint + "/" + s3_bucket;

const client = new S3Client({
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent
  }),
  credentials: fromIni({ profile: s3_profile }),
  endpoint: s3_endpoint,
  region: s3_region,
  maxAttempts: 3

});

exports.upload = async function (req, res, next) {
  const parentSpan = trace.getActiveSpan();
  await trace.getTracer('upload-service').startActiveSpan('upload_handler', async (span) => {
    try {
      span.setAttribute('call.shortName', req.params.shortName.toLowerCase());
      span.setAttribute('call.talkgroup_num', req.body.talkgroup_num);
      span.setAttribute('call.start_time', req.body.start_time);

      if (!req.file || ((path.extname(req.file.originalname) != '.m4a') && (path.extname(req.file.originalname) != '.mp3'))) {
        console.warn("[" + req.params.shortName + "] Error file name is wrong or file does not exist");
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: "Invalid file or filename",
        });
        res.status(500);
        res.send("Error, invalid filename:\n");
        return;
      }

      // Extract and parse request data


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
        parseSpan.end();


      let item = null;


      // Validate that the system exists and the API key is correct

      await trace.getTracer('upload-service').startActiveSpan('validate_system', async (validateSpan) => {

        try {
          item = await System.findOne({ 'shortName': shortName }, ["key", "ignoreUnknownTalkgroup"]);
          validateSpan.setAttribute('system.exists', !!item);


          if (!item) {
            validateSpan.setStatus({
              code: opentelemetry.SpanStatusCode.ERROR,
              message: "ShortName does not exist",
            });

            console.info("[" + req.params.shortName + "] Error /:shortName/upload ShortName does not exist");
            res.status(500);
            res.send("ShortName does not exist: " + shortName + "\n");
            return;
          }
          if (apiKey != item.key) {
            validateSpan.setStatus({
              code: opentelemetry.SpanStatusCode.ERROR,
              message: "API Key Mismatch",
            });
            console.warn("[" + req.params.shortName + "] Error /:shortName/upload API Key Mismatch - Provided key: " + apiKey);
            res.status(500);
            res.send("API Keys do not match!\n");
            return;
          }
        } catch (err) {
          validateSpan.recordException(err);
          validateSpan.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Error validating system: " + err.message,
          });
          res.status(500).send("Error, invalid shortName:\n" + err);
          return;
        } finally {
          validateSpan.end();
        }
      });

      // Blocking sensitive talkgroups
      await trace.getTracer('upload-service').startActiveSpan('check_sensitive_talkgroups', async (sensitiveSpan) => {

        if ((shortName == "hennearmer") && ((talkgroupNum == 3421) || (talkgroupNum == 3423))) {
          sensitiveSpan.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Sensitive Talkgroup",
          });
          res.status(200).end();
          return;
        }
        sensitiveSpan.end();
      });

      if (item.ignoreUnknownTalkgroup == true) {
        await trace.getTracer('upload-service').startActiveSpan('check_talkgroup_exists', async (talkgroupSpan) => {

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
          talkgroupSpan.end();
        });
      }
      // Add in an API Key check



      res.status(200).end();

      // Prepare call object
      let call;
      await trace.getTracer('upload-service').startActiveSpan('prepare_call_object', async (prepareSpan) => {

        var local_path = "/" + shortName + "/" + time.getFullYear() + "/" + (time.getMonth() + 1) + "/" + time.getDate() + "/";
        var object_key = "media/" + shortName + "-" + talkgroupNum + "-" + startTime + path.extname(req.file.originalname);

        var endpoint = s3_endpoint;
        var bucket = s3_bucket;
        var url = s3_public_url + "/" + object_key;

        call = new Call({
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
        prepareSpan.setAttribute('call.object_key', object_key);
        prepareSpan.setAttribute('call.url', url);
        prepareSpan.end();
      });

      let fileContent;
      // Upload file to S3
      await trace.getTracer('upload-service').startActiveSpan('upload_to_s3', async (uploadSpan) => {

        try {
          fileContent = fs.readFileSync(req.file.path);
          //s3Src = fs.createReadStream(req.file.path);

          const command = new PutObjectCommand({
            Bucket: s3_bucket,
            Key: object_key,
            Body: fileContent,
            ACL: 'public-read'
          });


          await client.send(command);


        } catch (err) {
          uploadSpan.recordException(err);
          uploadSpan.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Upload Error: " + err.message,
          });
          console.warn(`[${call.shortName}] Upload Error: ${err}`);
        } finally {
          uploadSpan.end();
        }
      });

      // Save call to database
      await trace.getTracer('upload-service').startActiveSpan('save_call', async (saveSpan) => {
        try {
          await call.save();
          sysStats.addCall(call.toObject());
          // we only want to notify clients if the clip is longer than 1 second.
          if (call.len >= 1) {
            req.call = call.toObject();
            next();
          }
        } catch (err) {
          saveSpan.recordException(err);
          saveSpan.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Error saving call: " + err.message,
          });
          console.warn(`[${call.shortName}] Error saving call: ${err}`);
        } finally {
          saveSpan.end();
        }
      });
      // Clean up temporary file
      await trace.getTracer('upload-service').startActiveSpan('cleanup_temp_file', async (cleanupSpan) => {
        try {
          fs.unlinkSync(req.file.path);
          cleanupSpan.setAttribute('file.deleted', true);
        } catch (err) {
          cleanupSpan.recordException(err);
          console.warn("There was an Error deleting: " + req.file.path);
        } finally {
          cleanupSpan.end();
        }
      });

    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: opentelemetry.SpanStatusCode.ERROR,
        message: error.message,
      });
    } finally {
      span.end();
    }
  });
};
