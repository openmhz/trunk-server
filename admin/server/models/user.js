// Defining a User Model in mongoose
// Code modified from https://github.com/sahat/hackathon-starter
//
// Kept in step with account/server/models/user.js. The account service owns
// accounts; admin reads them and flips a small number of flags. A field that is
// missing here is silently dropped from query results, which is how this file
// fell behind on callsign and city/state/country.
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	local: {
		name: String,
		email: String,
		password: String
	},
	email: {
		type: String,
		unique: true,
		lowercase: true
	},
	password: String,
	screenName: {
		type: String,
		unique: true,
		lowercase: true
	},
	// Stored lowercase so the unique index enforces case-insensitively.
	// Uppercased for display only.
	callsign: {
		type: String,
		unique: true,
		lowercase: true,
		trim: true,
		maxlength: 7
	},
	firstName: String,
	lastName: String,
	city: String,
	state: String,
	country: String,
	resetPasswordToken: String,
	resetPasswordTTL: Date,
	confirmEmail: {
		type: Boolean,
		default: false
	},
	confirmEmailToken: String,
	confirmEmailTTL: Date,
	admin: {
		type: Boolean,
		default: false
	},
	disabled: {
		type: Boolean,
		default: false
	},
	disabledAt: Date,
	disabledReason: String,
	// Kept in step with account/server/models/user.js - see the note there.
	plan: {
		type: String,
		enum: ['free', 'supporter'],
		default: 'free'
	},
	planGrantedAt: Date,
	planGrantedBy: mongoose.Schema.Types.ObjectId,
	terms: {
		type: Number,
		default: 0
	},
	ver: {
		type: Number,
		default: 1.1
	},
	sysCount: Number,
	lastLogin: { type : Date, default: Date.now }
})

// No password hashing hook here on purpose. Admin never sets a password - the
// account service does, and it is the only place that should. The hook that
// used to live here called bcrypt with bcrypt-nodejs' four-argument signature,
// so it would have thrown had anything ever triggered it.

/**
* Statics
*/
UserSchema.statics = {}

module.exports = mongoose.model("User", UserSchema)
