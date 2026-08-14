/**
 * Removes public-read from call audio already in the bucket.
 *
 *   docker exec hamrecorder-backend-1 node /home/app/scripts/make-media-private.js
 *   docker exec hamrecorder-backend-1 node /home/app/scripts/make-media-private.js --dry-run
 *
 * Uploads no longer set an ACL, but everything recorded before that is still
 * world-readable, and the object keys are guessable. Until this has run, the
 * listener gate can be walked around by anyone who knows or guesses a URL.
 *
 * Sets each object back to private. Safe to re-run - setting private on an
 * already-private object is a no-op.
 */
const { S3Client, ListObjectsV2Command, PutObjectAclCommand } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");

const s3_endpoint = process.env['S3_ENDPOINT'] ?? 'https://s3.us-west-1.wasabisys.com';
const s3_region = process.env['S3_REGION'] ?? 'us-west-1';
const s3_bucket = process.env['S3_BUCKET'] ?? 'openmhz-west';
const s3_profile = process.env['S3_PROFILE'] ?? 'wasabi-account';
const s3_force_path_style = (process.env['S3_FORCE_PATH_STYLE'] ?? 'false') === 'true';

const dryRun = process.argv.includes('--dry-run');

const client = new S3Client({
  credentials: fromIni({ profile: s3_profile }),
  endpoint: s3_endpoint,
  region: s3_region,
  forcePathStyle: s3_force_path_style,
});

async function main() {
  console.log(`Bucket: ${s3_bucket} at ${s3_endpoint}${dryRun ? '  (dry run)' : ''}`);

  let token = undefined;
  let seen = 0;
  let changed = 0;
  let failed = 0;

  do {
    const page = await client.send(new ListObjectsV2Command({
      Bucket: s3_bucket,
      Prefix: 'media/',
      ContinuationToken: token,
    }));

    for (const obj of page.Contents || []) {
      seen++;
      if (dryRun) {
        if (seen <= 5) console.log(`  would set private: ${obj.Key}`);
        continue;
      }
      try {
        await client.send(new PutObjectAclCommand({
          Bucket: s3_bucket,
          Key: obj.Key,
          ACL: 'private',
        }));
        changed++;
        if (changed % 100 === 0) console.log(`  ${changed} objects set private...`);
      } catch (err) {
        failed++;
        console.error(`  FAILED ${obj.Key}: ${err.message}`);
      }
    }

    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  console.log(`\nObjects seen: ${seen}`);
  if (dryRun) {
    console.log('Dry run - nothing changed.');
  } else {
    console.log(`Set private:  ${changed}`);
    if (failed) console.log(`Failed:       ${failed}`);
  }
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
