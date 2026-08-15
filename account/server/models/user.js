// Defining a User Model in mongoose
// Code modified from https://github.com/sahat/hackathon-starter
const bcrypt = require("bcrypt");
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
	// Mirrors callsign - see the pre-save hook below. Kept as its own field so
	// showScreenName on systems and the existing admin queries keep working.
	screenName: {
		type: String,
		unique: true,
		lowercase: true
	},
	// Stored lowercase so the unique index enforces case-insensitively - N6KEN
	// and n6ken cannot become two accounts. Uppercased for display only.
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
	// Optional: much of the world has no state or province.
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
	// Set from the admin portal. A disabled account keeps its data and its
	// systems - it just cannot sign in and cannot listen. Deleting is the
	// destructive option; this is the reversible one.
	disabled: {
		type: Boolean,
		default: false
	},
	disabledAt: Date,
	disabledReason: String,
	// What this account has paid for, or been given. "Supporter" is the only
	// word a user ever sees for it - never premium, paid or pro - because it
	// covers both people who subscribe and people who donate.
	//
	// A string enum rather than a boolean so further tiers need no migration.
	// Deliberately NOT called planType: that name already means something else
	// on the System model (its archive tier), and one name for two entities is
	// how a billing bug happens.
	plan: {
		type: String,
		enum: ['free', 'supporter'],
		default: 'free'
	},
	// Granted by an admin for now; Stripe comes later. Recording who and when is
	// cheap today and impossible to reconstruct afterwards - and once Supporter
	// can be earned by either a subscription or a one-off donation, "why does
	// this account have it" becomes a real support question.
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

/**
 * Password hash middleware.
 */
/*
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
})*/

/**
 * The callsign is the account's public identity, so screenName is derived from
 * it rather than entered separately. Both carry lowercase: true, so this stays
 * normalized whatever case the callsign arrives in.
 */
UserSchema.pre("save", function(next) {
	if (this.isModified("callsign") && this.callsign) {
		this.screenName = this.callsign;
	}
	next();
});

/**
 * Password hash middleware.
 */
UserSchema.pre("save", function(next) {
    if(!this.isModified("password")) {
        return next();
    }
	hashed = bcrypt.hashSync(this.password, 8);
	this.password = hashed;
	this.local.password = hashed;

    next();
});

/*
 Defining our own custom document instance method
 */
/*
 UserSchema.methods = {
 	comparePassword: function(candidatePassword, cb) {
 		bcrypt.compare(candidatePassword, this.local.password, (err, isMatch) => {
 			if (err) return cb(err)
 			cb(null, isMatch)
 		})
 	}
 }*/

 UserSchema.methods.comparePassword = function(plaintext, callback) {
    return callback(null, bcrypt.compareSync(plaintext, this.local.password));
};


/**
* Statics
*/
UserSchema.statics = {}

module.exports = mongoose.model("User", UserSchema)
