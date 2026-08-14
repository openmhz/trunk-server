/**
 * Signed playback URLs.
 *
 * Call audio used to be written world-readable and its URL stored on the Call
 * document, which meant gating the API achieved nothing: the object keys are
 * predictable (media/{shortName}/{talkgroup}/{shortName}-{talkgroup}-{start}.m4a)
 * and anyone holding a URL could listen without an account.
 *
 * Objects are now private. package_call hands the player a URL pointing back
 * here instead of at the bucket, and this redirects to a short-lived presigned
 * URL once the listener has been checked. The player needs no changes - it
 * still just plays call.url.
 */
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { fromIni } = require("@aws-sdk/credential-providers");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const Call = require("../models/call");

const s3_endpoint = process.env['S3_ENDPOINT'] ?? 'https://s3.us-west-1.wasabisys.com';
const s3_region = process.env['S3_REGION'] ?? 'us-west-1';
const s3_bucket = process.env['S3_BUCKET'] ?? 'openmhz-west';
const s3_profile = process.env['S3_PROFILE'] ?? 'wasabi-account';
const s3_public_url = process.env['S3_PUBLIC_URL'] ?? `${s3_endpoint}/${s3_bucket}`;
const s3_force_path_style = (process.env['S3_FORCE_PATH_STYLE'] ?? 'false') === 'true';

// A presigned URL's signature covers the host the browser will use, so it has
// to be generated against the public address of the store rather than the
// internal one the backend uploads through. S3_PUBLIC_URL is the endpoint with
// the bucket appended by convention, so strip the bucket back off; override
// with S3_PUBLIC_ENDPOINT if that assumption ever fails to hold.
const s3_public_endpoint = process.env['S3_PUBLIC_ENDPOINT']
  ?? s3_public_url.replace(new RegExp('/' + s3_bucket + '/?$'), '');

// Long enough to start playback and seek around, short enough that a leaked URL
// is worth little. The player re-requests it whenever a call is played again.
const URL_TTL_SECONDS = 300;

const presignClient = new S3Client({
  credentials: fromIni({ profile: s3_profile }),
  endpoint: s3_public_endpoint,
  region: s3_region,
  forcePathStyle: s3_force_path_style,
});

/**
 * The URL handed to the player for a call. Points at this service, not the
 * bucket, so the listener check happens on every playback.
 */
const backend_server = process.env['REACT_APP_BACKEND_SERVER'] != null ? process.env['REACT_APP_BACKEND_SERVER'] : 'https://api.hamrecorder.com';

exports.playbackUrl = function (shortName, callId) {
  return `${backend_server}/${shortName}/call/${callId}/media`;
};

exports.get_media = async function (req, res) {
  let o_id;
  try {
    o_id = ObjectId.createFromHexString(req.params.id);
  } catch (err) {
    res.status(400);
    res.contentType('json');
    res.send(JSON.stringify({ success: false, message: "Invalid call id" }));
    return;
  }

  let item;
  try {
    item = await Call.findById(o_id).exec();
  } catch (err) {
    console.error(`[${req.params.shortName}] Error /media looking up call: ${err}`);
    res.status(500);
    res.contentType('json');
    res.send(JSON.stringify({ success: false, message: "Could not look up call" }));
    return;
  }

  if (!item) {
    res.status(404);
    res.contentType('json');
    res.send(JSON.stringify({ success: false, message: "Call not found" }));
    return;
  }

  // Calls carry the bucket they were written to, so recordings made before a
  // bucket change still resolve.
  const bucket = item.bucket || s3_bucket;
  const key = item.objectKey;

  if (!key) {
    console.warn(`[${item.shortName}] Call ${req.params.id} has no objectKey`);
    res.status(404);
    res.contentType('json');
    res.send(JSON.stringify({ success: false, message: "Call has no stored audio" }));
    return;
  }

  let url;
  try {
    url = await getSignedUrl(
      presignClient,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: URL_TTL_SECONDS }
    );
  } catch (err) {
    console.error(`[${item.shortName}] Error signing playback URL: ${err}`);
    res.status(500);
    res.contentType('json');
    res.send(JSON.stringify({ success: false, message: "Could not sign playback URL" }));
    return;
  }

  // The redirect target expires, so it must never be cached or shared by an
  // intermediary as though it were the canonical location of the audio.
  res.set('Cache-Control', 'private, no-store');
  res.redirect(302, url);
};
