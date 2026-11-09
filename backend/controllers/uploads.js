const path = require('path');
const fs = require('fs');
const sysStats = require("../sys_stats");
const  systemSchema  = require("../models/systemSchema");
const  talkgroupSchema  = require("../models/talkgroupSchema");
const  callSchema  = require("../models/callSchema");
const mongoose = require("mongoose");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const https = require('https');

// keepAlive matters: without it every upload does a full TCP + TLS handshake to S3.
const agent = new https.Agent({
  keepAlive: true,
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

// Every upload needs the system's key, so cache the lookup. A changed key or
// ignoreUnknownTalkgroup setting takes up to the TTL to apply. Only found systems
// are cached, so a newly created system works immediately.
const SYSTEM_CACHE_TTL_MS = 60 * 1000;
const systemCache = new Map();

async function getSystem(shortName) {
  const cached = systemCache.get(shortName);
  if (cached && cached.expires > Date.now()) {
    return cached.system;
  }
  const system = await mongo_conn_fast.model("System").findOne({ shortName }, ["key", "ignoreUnknownTalkgroup"]).lean();
  if (system) {
    systemCache.set(shortName, { system, expires: Date.now() + SYSTEM_CACHE_TTL_MS });
  } else {
    systemCache.delete(shortName);
  }
  return system;
}

exports.upload = async function (req, res, next) {
  let start_time = Date.now();
  let validateSystemTime = 0;
  let readFileTime = 0;
  let uploadFileTime = 0;
  let saveCallTime = 0;
  let cleanupTime = 0;
  let statsTime = 0;
  try {
    if (!req.file || !['.m4a', '.mp3'].includes(path.extname(req.file.originalname))) {
      console.warn(`[${req.params.shortName}] Error file name is wrong or file does not exist`);
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

    try {
      item = await getSystem(shortName);
    } catch (err) {
      console.warn(`[${req.params.shortName}] Error validating system: ${err}`);
    }

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
      console.warn(`[${call.shortName}] Upload Error: ${err}`);
    }
    uploadFileTime = Date.now();

    try {
      await call.save();
    } catch (err) {
      console.warn(`[${call.shortName}] Error saving call: ${err}`);
    }

    saveCallTime = Date.now();
    sysStats.addCall(call.toObject());
    statsTime = Date.now();

    if (call.len >= 1) {
      req.call = call.toObject();
      next();
    }

    //console.log(`[${call.shortName}] \t Verify System: ${validateSystemTime - start_time}  \t Read file: ${readFileTime - validateSystemTime} \t Upload: ${ uploadFileTime - validateSystemTime} \t Save: ${saveCallTime - uploadFileTime} \tStats: ${statsTime - saveCallTime}\tCleanup: ${cleanupTime - statsTime} \t\t Total: ${cleanupTime - start_time}`);
  } catch (error) {
    console.error("Error processing call upload: " + error);
  } finally {
    // multer has already written the temp file, so remove it on every exit path.
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn("There was an Error deleting: " + req.file.path);
      }
    }
    cleanupTime = Date.now();
    const totalTime = Date.now() - start_time;
    if (totalTime > 10000) {
      console.warn(`[${req.params.shortName}] Slow Upload - Size: ${call.len} Verify System: ${validateSystemTime - start_time}  Read file: ${readFileTime - validateSystemTime} Upload: ${ uploadFileTime - validateSystemTime} Save: ${saveCallTime - uploadFileTime} Stats: ${statsTime - saveCallTime} Cleanup: ${cleanupTime - statsTime} Total: ${totalTime}`);
    }
  }
};
