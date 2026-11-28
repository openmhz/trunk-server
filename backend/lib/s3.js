// S3 client settings shared by uploads and events.
//
// Production uses the ~/.aws credentials profile named by S3_PROFILE. The test
// stack (compose.test.yaml) runs a local S3 emulator instead, which needs
// static credentials and path-style URLs (http://s3:9090/bucket/key), so both
// can be set from the environment. Unset, nothing changes.
const { fromIni } = require("@aws-sdk/credential-providers");

const settings = {
  endpoint: process.env.S3_ENDPOINT ?? "https://s3.us-west-1.wasabisys.com",
  region: process.env.S3_REGION ?? "us-west-1",
  bucket: process.env.S3_BUCKET ?? "openmhz-west",
  profile: process.env.S3_PROFILE ?? "wasabi-account",
};
settings.publicUrl = process.env.S3_PUBLIC_URL ?? `${settings.endpoint}/${settings.bucket}`;

function credentials() {
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    };
  }
  return fromIni({ profile: settings.profile });
}

// Options for `new S3Client(...)`; `extra` adds e.g. a request handler.
function clientOptions(extra = {}) {
  return {
    credentials: credentials(),
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    endpoint: settings.endpoint,
    region: settings.region,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    maxAttempts: 2,
    ...extra,
  };
}

module.exports = { settings, clientOptions };
