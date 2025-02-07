const path = require('path');
const fs = require('fs');
const opentelemetry = require('@opentelemetry/api');
const sysStats = require("../sys_stats");
const  systemSchema  = require("../models/systemSchema");
const  talkgroupSchema  = require("../models/talkgroupSchema");
const  callSchema  = require("../models/callSchema");
const { trace, context } = opentelemetry;
const mongoose = require("mongoose");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const https = require('https');

const agent = new https.Agent({
  maxSockets: 250,
});

const s3_endpoint = process.env['S3_ENDPOINT'] ?? 'https://s3.us-west-1.wasabisys.com';
const s3_region = process.env['S3_REGION'] ?? 'us-west-1';
const s3_bucket = process.env['S3_BUCKET'] ?? 'openmhz-west';
const s3_profile = process.env['S3_PROFILE'] ?? 'wasabi-account';
const s3_public_url = process.env['S3_PUBLIC_URL'] ?? `${s3_endpoint}/${s3_bucket}`;
const host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'mongo';
const port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;
const mongoUrl = 'mongodb://' + host + ':' + port + '/scanner';


// `asPromise()` returns a promise that resolves to the connection
// once the connection succeeds, or rejects if connection failed.
const mongo_conn_slow = mongoose.createConnection(mongoUrl,  { maxPoolSize: 150 });
const mongo_conn_fast = mongoose.createConnection(mongoUrl,  { maxPoolSize: 150 });
mongo_conn_slow.on('error', console.error);
mongo_conn_fast.on('error', console.error);
mongo_conn_slow.on('disconnected', () => {
  console.log('Mongo Slow Disconnected');
  mongo_conn_slow.openUri(mongoUrl, { maxPoolSize: 150 }).catch(console.error);
});
mongo_conn_fast.on('disconnected', () => {
  console.log('Mongo Fast Disconnected');
  mongo_conn_fast.openUri(mongoUrl, { maxPoolSize: 150 }).catch(console.error);
});

mongo_conn_slow.model('Call', callSchema);
mongo_conn_fast.model('System', systemSchema);
mongo_conn_fast.model('Talkgroup', talkgroupSchema);



const client = new S3Client({
  requestHandler: new NodeHttpHandler({
    httpsAgent: agent,
  }),
  credentials: fromIni({ profile: s3_profile }),
  requestChecksumCalculation: 'WHEN_REQUIRED',
 	responseChecksumValidation: 'WHEN_REQUIRED',
  endpoint: s3_endpoint,
  region: s3_region,
  maxAttempts: 2,
});

exports.upload = async function (req, res, next) {
  const tracer = trace.getTracer("upload-service");
  let start_time = Date.now();
  let validateSystemTime = 0;
  let readFileTime = 0;
  let uploadFileTime = 0;
  let saveCallTime = 0;
  let cleanupTime = 0;
  let statsTime = 0;
  return context.with(context.active(), async () => {
    const parentSpan = trace.getActiveSpan(context.active());
    await tracer.startActiveSpan('upload_handler', { parent: parentSpan }, async (span) => {
      try {
        span.setAttribute('call.shortName', req.params.shortName.toLowerCase());
        span.setAttribute('call.talkgroup_num', req.body.talkgroup_num);
        span.setAttribute('call.start_time', req.body.start_time);

        if (!req.file || !['.m4a', '.mp3'].includes(path.extname(req.file.originalname))) {
          console.warn(`[${req.params.shortName}] Error file name is wrong or file does not exist`);
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: "Invalid file or filename",
          });
          res.status(500).send("Error, invalid filename:\n");
          return;
        }

        const shortName = req.params.shortName.toLowerCase();
        const apiKey = req.body.api_key;
        const talkgroupNum = parseInt(req.body.talkgroup_num);
        const freq = parseFloat(req.body.freq);
        const time = new Date(parseInt(req.body.start_time) * 1000);
        let stopTime = new Date();
        if (req.body.stop_time) {
          stopTime = new Date(parseInt(req.body.stop_time) * 1000);
        }
        const startTime = req.body.start_time;
        const emergency = parseInt(req.body.emergency);

        let errorCount = parseInt(req.body.error_count) || 0;
        let spikeCount = parseInt(req.body.spike_count) || 0;

        let srcList = [];
        try {
          srcList = JSON.parse(req.body.source_list);
        } catch (err) {
          console.warn(`[${req.params.shortName}] Error /:shortName/upload Parsing Source/Freq List - Error: ${err}`);
          res.status(500).send("Error parsing sourcelist " + err);
          return;
        }

        patches = [];

        let req_patches;
        req_patches = req.body.patch_list;
      
        if(typeof req_patches != "undefined"){
          var split_patches = req_patches.replace("[","").replace("]","").split(",");
      
          for (var patch in split_patches){
            patches.push(split_patches[patch]);
          } 
        }

        let item = null;

        await tracer.startActiveSpan('validate_system', { parent: trace.getActiveSpan(context.active()) }, async (validateSpan) => {
          try {
            item = await mongo_conn_fast.model("System").findOne({ shortName }, ["key", "ignoreUnknownTalkgroup"]);
            validateSpan.setAttribute('system.exists', !!item);
          } catch (err) {
            validateSpan.recordException(err);
            validateSpan.setStatus({
              code: opentelemetry.SpanStatusCode.ERROR,
              message: "Error validating system: " + err.message,
            });
          } finally {
            validateSpan.end();
          }
        });

        if (!item) {
          console.warn(`[${req.params.shortName}] Error /:shortName/upload ShortName does not exist`);
          res.status(500).send("ShortName does not exist: " + shortName + "\n");
          return;
        }
        if (apiKey !== item.key) {
          console.warn(`[${req.params.shortName}] Error /:shortName/upload API Key Mismatch - Provided key: ${apiKey}`);
          res.status(500).send("API Keys do not match!\n");
          return;
        }

        if (shortName === "hennearmer" && [3421, 3423].includes(talkgroupNum)) {
          res.status(200).end();
          return;
        }
        validateSystemTime = Date.now();
        if (item.ignoreUnknownTalkgroup) {
          const talkgroupExists = await mongo_conn_fast.model("Talkgroup").exists({
            shortName,
            num: talkgroupNum,
          });

          if (!talkgroupExists) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (err) {
              console.error(`[${call.shortName}] error deleting: ${req.file.path}`);
            }
            res.status(500).send("Talkgroup does not exist, skipping.\n");
            return;
          }
        }

        res.status(200).end();

        const local_path = `/${shortName}/${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()}/`;
        const object_key = `media/${shortName}/${talkgroupNum}/${shortName}-${talkgroupNum}-${startTime}${path.extname(req.file.originalname)}`;
        const url = `${s3_public_url}/${object_key}`;

        const call = new (mongo_conn_slow.model("Call"))({
          shortName,
          talkgroupNum,
          objectKey: object_key,
          endpoint: s3_endpoint,
          bucket: s3_bucket,
          time,
          name: `${talkgroupNum}-${startTime}.m4a`,
          freq,
          errorCount,
          spikeCount,
          url,
          emergency,
          path: local_path,
          patches: patches,
          srcList,
          len: req.body.call_length ? parseFloat(req.body.call_length) : (stopTime - time) / 1000,
        });

        let fileContent;

        await tracer.startActiveSpan('upload_to_s3', { parent: trace.getActiveSpan(context.active()) }, async (uploadSpan) => {
          try {
            fileContent = fs.readFileSync(req.file.path);
            readFileTime = Date.now();
            const command = new PutObjectCommand({
              Bucket: s3_bucket,
              Key: object_key,
              Body: fileContent,
              ACL: 'public-read',
            });
            var result = await client.send(command);
            if (result && result.$metadata.httpStatusCode !== 200) {
              console.error(`[${shortName}] Upload Error status code: ${result.$metadata.httpStatusCode}`);
              console.error(result);
            } 
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
        uploadFileTime = Date.now();
        await tracer.startActiveSpan('save_call', { parent: trace.getActiveSpan(context.active()) }, async (saveSpan) => {
          try {
            await call.save();
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

        saveCallTime = Date.now();
        sysStats.addCall(call.toObject());
        statsTime = Date.now();

        if (call.len >= 1) {
          req.call = call.toObject();
          next();
        }

        await tracer.startActiveSpan('cleanup_temp_file', { parent: trace.getActiveSpan(context.active()) }, async (cleanupSpan) => {
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
        cleanupTime = Date.now();
        //console.log(`[${call.shortName}] \t Verify System: ${validateSystemTime - start_time}  \t Read file: ${readFileTime - validateSystemTime} \t Upload: ${ uploadFileTime - validateSystemTime} \t Save: ${saveCallTime - uploadFileTime} \tStats: ${statsTime - saveCallTime}\tCleanup: ${cleanupTime - statsTime} \t\t Total: ${cleanupTime - start_time}`);
      } catch (error) {
        console.error("Error processing call upload: " + error);
        span.recordException(error);
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message,
        });
      } finally {
        const totalTime = Date.now() - start_time;
        if (totalTime > 10000) {
          console.warn(`[${req.params.shortName}] Slow Upload - Size: ${call.len} Verify System: ${validateSystemTime - start_time}  Read file: ${readFileTime - validateSystemTime} Upload: ${ uploadFileTime - validateSystemTime} Save: ${saveCallTime - uploadFileTime} Stats: ${statsTime - saveCallTime} Cleanup: ${cleanupTime - statsTime} Total: ${totalTime}`);
        }
        span.end();
      }

    });
  });
};