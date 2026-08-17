var mongoose = require('mongoose');

var srcSchema = mongoose.Schema({ pos: Number, src: String });

// One line per spoken passage. Not sent to the browser yet - they cost three or
// four times the plain text and nothing renders them - but they are what
// click-to-seek needs later, and re-running Whisper to recover them is far more
// expensive than storing them now.
var transcriptSegmentSchema = mongoose.Schema({
  start: Number,
  end: Number,
  text: String
}, { _id: false });

const callSchema = mongoose.Schema({
  talkgroupNum: Number,
  shortName: String,
  objectKey: String,
  endpoint: String,
  bucket: String,
  time: Date,
  name: String,
  freq: Number,
  errorCount: Number,
  spikeCount: Number,
  url: String,
  emergency: Boolean,
  path: String,
  len: Number,
  patches: [Number],
  star: {
		type: Number,
		default: 0
	},
  srcList: [srcSchema],

  // ---- Transcription -------------------------------------------------------
  //
  // Embedded on the call rather than kept in its own collection, because
  // backend/db.js cleanOldCalls() and mongo/clean.js both delete from `calls`
  // only. Embedded, a transcript dies with its audio for free; in a separate
  // collection it would need its own sweep, and a sweep that is ever forgotten
  // leaves the text of transmissions outliving the recording it came from.
  //
  // Every field is prefixed `transcript` on purpose: this schema is shared with
  // upstream openmhz, and a generic name like `status` would collide on the
  // next merge.
  transcript: {
    text: String,
    segments: [transcriptSegmentSchema],
    engine: String,
    model: String,
    language: String,
    computeMs: Number,
    createdAt: Date
  },
  // skipped | pending | done | failed | expired
  //
  // Defaults to 'skipped', not 'pending'. Mongoose defaults apply only to newly
  // created documents, so every call that already exists has no field at all and
  // never matches the claim query - deploying this does not enqueue a month of
  // backlog. It also means a code path that forgets to set 'pending' produces an
  // inert document rather than an unbounded queue.
  transcriptStatus: {
    type: String,
    default: 'skipped'
  },
  transcriptAttempts: {
    type: Number,
    default: 0
  },
  transcriptClaimedAt: Date,
  transcriptError: String
});

// The claim query the worker runs every couple of seconds. Without an index it
// is a full collection scan over every call in the 30-day window, forever.
//
// Partial, so it only holds documents actually waiting: in steady state that is
// a handful of entries rather than tens of thousands.
callSchema.index(
  { transcriptClaimedAt: 1, time: -1 },
  { partialFilterExpression: { transcriptStatus: 'pending' } }
);

// Transcript search. A text index rather than a regex: it is indexed, it
// tokenises and stems, and it supports quoted phrases - where a regex over the
// whole collection has no index at all and turns user input into a ReDoS
// surface. Mongo allows only one text index per collection, so this is it.
//
// Only reaches calls that still exist, which is the point: transcripts are
// deleted with their audio at 30 days, so search covers the archive and not
// one day longer.
callSchema.index({ 'transcript.text': 'text' });

module.exports = callSchema;