// One row per login attempt. Written here; read by the admin service.
// Kept byte-identical to admin/server/models/login_event.js.
const mongoose = require("mongoose");

const LoginEventSchema = new mongoose.Schema({
	// Absent when the submitted email matched no account at all.
	userId: { type: mongoose.Schema.Types.ObjectId, index: true },
	// As submitted, lowercased. Worth keeping separately from userId: a run of
	// failures against addresses that do not exist is the signal you want to see.
	email: String,
	callsign: String,
	success: { type: Boolean, index: true },
	// "ok" | "no such account" | "bad password" | "disabled" | "unconfirmed email"
	reason: String,
	ip: { type: String, index: true },
	city: String,
	region: String,
	country: String,
	userAgent: String,
	createdAt: { type: Date, default: Date.now }
})

// This is personal data - an IP address and an approximate location per login.
// 90 days is long enough to investigate an incident and short enough that the
// site is not quietly building a movement history of its users. A single-field
// index is traversable in either direction, so this one TTL index also serves
// the newest-first sort the admin screen needs.
LoginEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 })

module.exports = mongoose.models.LoginEvent || mongoose.model("LoginEvent", LoginEventSchema)
