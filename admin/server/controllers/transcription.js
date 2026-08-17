/**
 * Is transcription actually working?
 *
 * Without this the first sign that the pipeline has stopped is a Supporter
 * asking why transcripts vanished - and because the worker fails softly by
 * design (a whisper outage leaves calls pending and the site entirely
 * unaffected), nothing else would ever say so.
 *
 * Reads mongo directly rather than calling the backend: admin already has the
 * connection, and it sits on the same internal network as whisper so it can
 * check that too.
 */
const Call = require("../models/call");

const whisper_url = process.env['WHISPER_URL'] != null ? process.env['WHISPER_URL'] : "http://whisper:9000";

// Matches TRANSCRIBE_MAX_AGE_MS in the worker: past this a call will never be
// claimed, so anything still pending and older is stuck, not queued.
const MAX_AGE_MS = parseInt(process.env['TRANSCRIBE_MAX_AGE_MS'] || String(2 * 60 * 60 * 1000), 10);

async function whisperHealth() {
  try {
    const response = await fetch(`${whisper_url}/healthz`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { reachable: false, error: `HTTP ${response.status}` };
    const body = await response.json();
    return { reachable: true, model: body.model, warm: !!body.warm };
  } catch (err) {
    return { reachable: false, error: err.message };
  }
}

exports.stats = async function (req, res, next) {
  try {
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [byStatus, oldestPending, recent, failures, whisper] = await Promise.all([
      Call.aggregate([
        { $match: { transcriptStatus: { $exists: true } } },
        { $group: { _id: "$transcriptStatus", n: { $sum: 1 } } }
      ]),
      Call.findOne({ transcriptStatus: "pending" }, { time: 1 }).sort({ time: 1 }).lean(),
      // Throughput and cost over the last day, and how much of it came back
      // empty - a sudden jump in "no speech" is what a broken decode looks like
      // from the outside.
      Call.aggregate([
        { $match: { transcriptStatus: "done", "transcript.createdAt": { $gte: dayAgo } } },
        {
          $group: {
            _id: null,
            n: { $sum: 1 },
            avgComputeMs: { $avg: "$transcript.computeMs" },
            totalComputeMs: { $sum: "$transcript.computeMs" },
            totalAudioSec: { $sum: "$len" },
            noSpeech: { $sum: { $cond: [{ $eq: ["$transcript.text", ""] }, 1, 0] } }
          }
        }
      ]),
      Call.find({ transcriptStatus: "failed" }, { shortName: 1, talkgroupNum: 1, time: 1, len: 1, transcriptError: 1, transcriptAttempts: 1 })
        .sort({ time: -1 }).limit(10).lean(),
      whisperHealth()
    ]);

    const counts = { pending: 0, done: 0, failed: 0, expired: 0, skipped: 0 };
    byStatus.forEach(row => { counts[row._id] = row.n; });

    const day = recent[0] || {};
    const oldestPendingAgeSec = oldestPending
      ? Math.round((now - new Date(oldestPending.time).getTime()) / 1000)
      : null;

    res.json({
      success: true,
      counts: counts,
      oldestPendingAgeSec: oldestPendingAgeSec,
      // A pending call older than the worker's cutoff will never be picked up.
      // One or two means a brief outage; a growing number means it is broken.
      stuckPending: await Call.countDocuments({
        transcriptStatus: "pending",
        time: { $lt: new Date(now - MAX_AGE_MS) }
      }),
      lastDay: {
        transcribed: day.n || 0,
        noSpeech: day.noSpeech || 0,
        avgComputeMs: day.avgComputeMs ? Math.round(day.avgComputeMs) : 0,
        // Whisper time as a fraction of audio time. Comfortably under 1 means
        // there is headroom; approaching 1 means the queue will start growing
        // during a busy net.
        realtimeFactor: day.totalAudioSec
          ? Math.round((day.totalComputeMs / 1000 / day.totalAudioSec) * 100) / 100
          : 0,
        audioMinutes: day.totalAudioSec ? Math.round(day.totalAudioSec / 60) : 0
      },
      recentFailures: failures,
      whisper: whisper
    });
  } catch (err) {
    console.error("Error - transcription stats: " + err);
    res.status(500);
    res.json({ success: false, message: "Could not read transcription stats" });
  }
}
