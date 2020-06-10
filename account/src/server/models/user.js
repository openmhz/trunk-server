// Defining a User Model in mongoose
// Code modified from https://github.com/sahat/hackathon-starter
import bcrypt from "bcrypt-nodejs"
import mongoose from "mongoose"
import crypto from "crypto"



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
	firstName: String,
	lastName: String,
	location: String,
	email: String,
	resetPasswordToken: String,
	resetPasswordTTL: Date,
	confirmEmail: {
		type: Boolean,
		default: false
	},
	customerId: {
		type: String,
		default: ""
	},
	confirmEmailToken: String,
	confirmEmailTTL: Date,
	admin: {
		type: Boolean,
		default: false
	},
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
			user.password = hash
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

export default mongoose.model("User", UserSchema)
