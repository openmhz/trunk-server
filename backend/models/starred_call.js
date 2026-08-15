// A call one particular listener has starred.
//
// Replaces the `star` counter that used to live on the call itself. That was a
// single global number - anyone starring a call starred it for everybody, and
// "show only starred calls" showed everyone's, which is why it looked broken.
// A star is a personal bookmark, so it belongs to a (user, call) pair.
const mongoose = require("mongoose");

const StarredCallSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, required: true },
	callId: { type: mongoose.Schema.Types.ObjectId, required: true },
	// Denormalised so "my starred calls on this system" is one indexed query
	// rather than a join back to the calls collection.
	shortName: { type: String, required: true },
	createdAt: { type: Date, default: Date.now }
})

// Starring is idempotent: the unique index means a double click, or two tabs,
// cannot produce two rows for the same call.
StarredCallSchema.index({ userId: 1, callId: 1 }, { unique: true })

// Serves the starred filter: this listener's stars on one system, newest first.
StarredCallSchema.index({ userId: 1, shortName: 1, createdAt: -1 })

module.exports = mongoose.models.StarredCall || mongoose.model("StarredCall", StarredCallSchema)
