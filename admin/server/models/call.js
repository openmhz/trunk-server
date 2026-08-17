// A read-only view of the calls collection, for the transcription health
// screen. Deliberately not the full schema from backend/models/callSchema.js -
// admin never writes a call, and only needs the transcription fields plus
// enough identity to say which call a failure belongs to.
//
// strict: false so this cannot silently drop fields if the backend schema grows.
const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema({
	shortName: String,
	talkgroupNum: Number,
	time: Date,
	len: Number,
	transcript: {
		text: String,
		computeMs: Number,
		model: String,
		createdAt: Date
	},
	transcriptStatus: String,
	transcriptAttempts: Number,
	transcriptClaimedAt: Date,
	transcriptError: String
}, { strict: false, collection: "calls" })

module.exports = mongoose.models.Call || mongoose.model("Call", CallSchema)
