// Defining a User Model in mongoose
// Code modified from https://github.com/sahat/hackathon-starter
var bcrypt = require("bcrypt-nodejs");
var mongoose = require("mongoose");
var crypto = require("crypto");



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
	// Kept in step with account/server/models/user.js. The backend only reads
	// these - accounts are created and edited by the account service - but a
	// field missing from this schema is silently dropped from query results.
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
	email: String,
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
	terms: {
		type: Number,
		default: 0
	},
	ver: {
		type: Number,
		default: 1.2
	},
	sysCount: Number,
	lastLogin: { type : Date, default: Date.now }
})

/**
 * Password hash middleware.
 */
UserSchema.pre("save", function(next) {
	var user = this
	if (!user.isModified("password")) return next()
	bcrypt.genSalt(8, (err, salt) => {
		if (err) return next(err)
		bcrypt.hash(user.password, salt, null, (err, hash) => {
			if (err) return next(err)
			user.password = hash;
			user.local.password = hash;
			next()
		})
	})
})

/*
 Defining our own custom document instance method
 */
 UserSchema.methods = {
 	comparePassword: function(candidatePassword, cb) {
 		bcrypt.compare(candidatePassword, this.local.password, (err, isMatch) => {
 			if (err) return cb(err)
 			cb(null, isMatch)
 		})
 	}
 }

/**
* Statics
*/
UserSchema.statics = {}

module.exports=mongoose.model("User", UserSchema)
