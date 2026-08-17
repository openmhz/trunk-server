/**
 * Claims calls waiting for transcription, transcribes them, writes the result
 * back.
 *
 * The Call document is the queue. There is no Redis and no queue library here,
 * and none is needed: `transcriptStatus` plus one atomic findOneAndUpdate gives
 * durability across restarts, recovery from a crashed worker, and safety if
 * more than one of these ever runs.
 *
 * Runs as its own process rather than inside the backend. The backend serves
 * both the ingest hot path and the read API, and this project has already
 * learned once what happens when slow work shares that event loop.
 */
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require('@aws-sdk/credential-providers');
const { transcribe, TranscribeError, WHISPER_URL } = require('./client');

const s3_endpoint = process.env['S3_ENDPOINT'] ?? 'https://s3.us-west-1.wasabisys.com';
const s3_region = process.env['S3_REGION'] ?? 'us-west-1';
const s3_bucket = process.env['S3_BUCKET'] ?? 'openmhz-west';
const s3_profile = process.env['S3_PROFILE'] ?? 'wasabi-account';
const s3_force_path_style = (process.env['S3_FORCE_PATH_STYLE'] ?? 'false') === 'true';

const POLL_INTERVAL_MS = parseInt(process.env['TRANSCRIBE_POLL_MS'] ?? '2000', 10);
const MAX_ATTEMPTS = parseInt(process.env['TRANSCRIBE_MAX_ATTEMPTS'] ?? '3', 10);
// A claim older than this is assumed to belong to a worker that died. This is
// the reconciliation sweep - there is no separate one.
const CLAIM_TTL_MS = parseInt(process.env['TRANSCRIBE_CLAIM_TTL_MS'] ?? String(10 * 60 * 1000), 10);
// Calls older than this are never claimed. After a long outage nobody wants a
// day of catch-up transcripts for calls they will never scroll back to.
const MAX_AGE_MS = parseInt(process.env['TRANSCRIBE_MAX_AGE_MS'] ?? String(2 * 60 * 60 * 1000), 10);
// How long to stop claiming for when whisper is unreachable, so an outage does
// not chew through every call's attempt budget.
const BREAKER_MS = parseInt(process.env['TRANSCRIBE_BREAKER_MS'] ?? '30000', 10);
// How often to retire calls that aged past the claim cutoff.
const SWEEP_INTERVAL_MS = parseInt(process.env['TRANSCRIBE_SWEEP_MS'] ?? String(30 * 60 * 1000), 10);

const client = new S3Client({
  credentials: fromIni({ profile: s3_profile }),
  endpoint: s3_endpoint,
  region: s3_region,
  maxAttempts: 2,
  forcePathStyle: s3_force_path_style,
});

let stopping = false;
let breakerUntil = 0;

function log(...args) {
  console.log(new Date().toISOString(), '[transcriber]', ...args);
}

/**
 * Take the next waiting call, atomically.
 *
 * Newest first: under a backlog, the calls people are actually listening to get
 * transcripts and the tail ages out. That is a deliberate product choice - it
 * degrades to "recent calls have transcripts" rather than "the whole feed is
 * hours behind".
 */
async function claim(Call) {
  const now = Date.now();
  return Call.findOneAndUpdate(
    {
      transcriptStatus: 'pending',
      transcriptAttempts: { $lt: MAX_ATTEMPTS },
      time: { $gt: new Date(now - MAX_AGE_MS) },
      $or: [
        { transcriptClaimedAt: null },
        { transcriptClaimedAt: { $exists: false } },
        { transcriptClaimedAt: { $lt: new Date(now - CLAIM_TTL_MS) } },
      ],
    },
    {
      $set: { transcriptClaimedAt: new Date() },
      $inc: { transcriptAttempts: 1 },
    },
    { sort: { time: -1 }, new: true }
  );
}

async function fetchAudio(call) {
  const result = await client.send(new GetObjectCommand({
    Bucket: call.bucket || s3_bucket,
    Key: call.objectKey,
  }));
  return Buffer.from(await result.Body.transformToByteArray());
}

async function markFailed(Call, call, reason) {
  await Call.updateOne({ _id: call._id }, {
    $set: {
      transcriptStatus: 'failed',
      transcriptError: String(reason).slice(0, 300),
      transcriptClaimedAt: null,
    },
  });
}

/**
 * Release the claim so the call is picked up again.
 *
 * `refund` gives the attempt back. Attempts are meant to bound how many times
 * we retry audio that keeps failing - not to count outages. Without the refund,
 * a whisper restart during a quiet period lets the worker claim the same newest
 * call over and over, exhaust its three attempts, and mark it permanently
 * failed for a problem that had nothing to do with it.
 */
async function release(Call, call, { refund = false } = {}) {
  const update = { $set: { transcriptClaimedAt: null } };
  if (refund) update.$inc = { transcriptAttempts: -1 };
  await Call.updateOne({ _id: call._id }, update);
}

async function handle(Call, call) {
  let audio;
  try {
    audio = await fetchAudio(call);
  } catch (err) {
    // uploads.js swallows a failed PutObject and saves the call anyway, so
    // calls whose audio never made it to the bucket genuinely exist. There is
    // nothing to transcribe and never will be.
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      log(`${call._id} audio missing at ${call.objectKey} - marking failed`);
      await markFailed(Call, call, 'audio missing from storage');
      return;
    }
    // S3 was reachable enough to answer but something else went wrong. Nothing
    // was learned about the audio, so the attempt is refunded here too.
    log(`${call._id} could not fetch audio: ${err.message}`);
    await release(Call, call, { refund: true });
    return;
  }

  let result;
  try {
    result = await transcribe(audio, call.name || 'call.m4a');
  } catch (err) {
    if (err instanceof TranscribeError && err.terminal) {
      log(`${call._id} rejected by whisper: ${err.message}`);
      await markFailed(Call, call, err.message);
      return;
    }
    // Transient. Put it back and stop claiming for a while - if whisper is
    // down, hammering it just burns every call's attempts.
    log(`${call._id} transient failure, backing off: ${err.message}`);
    await release(Call, call, { refund: !!err.unreachable });
    breakerUntil = Date.now() + BREAKER_MS;
    return;
  }

  await Call.updateOne({ _id: call._id }, {
    $set: {
      transcriptStatus: 'done',
      transcriptClaimedAt: null,
      transcriptError: null,
      transcript: {
        text: result.text || '',
        segments: result.segments || [],
        engine: result.engine,
        model: result.model,
        language: result.language,
        computeMs: result.computeMs,
        createdAt: new Date(),
      },
    },
  });

  // An empty transcript is a real answer, not a failure: whisper heard no
  // speech. Logged distinctly so "everything is coming back empty" is visible.
  log(`${call._id} ${call.shortName}/${call.talkgroupNum} ${Math.round(call.len)}s -> ` +
      (result.text ? `${result.computeMs}ms, ${result.text.length} chars` : `${result.computeMs}ms, no speech`));
}

/**
 * Retire calls that will never be claimed.
 *
 * The claim query ignores anything older than MAX_AGE_MS, so after an outage
 * those rows sit at 'pending' forever - not queued, not failed, just wrong.
 * That matters mostly because it makes the pending count meaningless as a
 * health signal: you cannot tell a real backlog from old debris.
 */
async function expireStale(Call) {
  try {
    const result = await Call.updateMany(
      {
        transcriptStatus: 'pending',
        time: { $lt: new Date(Date.now() - MAX_AGE_MS) },
      },
      {
        $set: {
          transcriptStatus: 'expired',
          transcriptClaimedAt: null,
          transcriptError: 'not transcribed before the age cutoff',
        },
      }
    );
    if (result.modifiedCount) {
      log(`expired ${result.modifiedCount} pending calls past the age cutoff`);
    }
    return result.modifiedCount;
  } catch (err) {
    log('could not expire stale calls:', err.message);
    return 0;
  }
}

async function run(Call) {
  log(`started - whisper at ${WHISPER_URL}, poll ${POLL_INTERVAL_MS}ms, ` +
      `max ${MAX_ATTEMPTS} attempts, claim ttl ${CLAIM_TTL_MS}ms`);

  // Swept on a timer rather than on a schedule library: the loop is already
  // running, and this only needs to happen occasionally.
  let nextSweep = Date.now();

  while (!stopping) {
    try {
      if (Date.now() >= nextSweep) {
        nextSweep = Date.now() + SWEEP_INTERVAL_MS;
        await expireStale(Call);
      }

      if (Date.now() < breakerUntil) {
        await sleep(Math.min(POLL_INTERVAL_MS, breakerUntil - Date.now()));
        continue;
      }

      const call = await claim(Call);
      if (!call) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      await handle(Call, call);
    } catch (err) {
      // Never let the loop die. A worker that exits silently is worse than one
      // that logs and carries on.
      log('unexpected error in loop:', err && err.stack ? err.stack : err);
      await sleep(POLL_INTERVAL_MS);
    }
  }

  log('stopped');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function stop() {
  stopping = true;
}

module.exports = { run, stop, claim, expireStale };
