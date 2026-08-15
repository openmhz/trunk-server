/*
 Configuring local strategy to authenticate strategies
 Code modified from : https://github.com/madhums/node-express-mongoose-demo/blob/master/config/passport/local.js
 */

const LocalStrategy = require("passport-local").Strategy;
const User = require("../../models/user");

var admin_email = process.env['REACT_APP_ADMIN_EMAIL'] != null ? process.env['REACT_APP_ADMIN_EMAIL'] : "admin@hamrecorder.com";
/*
By default, LocalStrategy expects to find credentials in parameters named username and password.
If your site prefers to name these fields differently, options are available to change the defaults.
*/
const local = new LocalStrategy({
	usernameField: "email"
}, async (email, password, done) => {

	// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex/6969486#6969486
	const escapeRegExp = (string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
	const user = await User.findOne({
		$or: [{
			email: { '$regex': escapeRegExp(email), $options: 'i' } 
		}, {
			local: {
				email: { '$regex': escapeRegExp(email), $options: 'i' } 
			}
		}]
	});
	if (!user) {
		console.error("Auth Error - user not found: " + email);
		// The reason is for the audit trail, not the visitor - the message stays
		// identical to a wrong password so this cannot be used to find out which
		// addresses have accounts.
		return done(null, false, { message: `Invalid email or password`, reason: "no such account" })
	}
	// Checked before the password so a disabled account gets a clear answer
	// rather than looking like a wrong password. It is not an information leak:
	// you have to know the account exists to get here anyway.
	if (user.disabled) {
		console.error("Auth Error - account is disabled: " + email);
		return done(null, false, { message: `This account has been disabled. Contact ${admin_email} if you think that is a mistake.`, reason: "disabled", userId: user.id, callsign: user.callsign })
	}
	if (!user.confirmEmail) {
		console.error("Auth Error - user has not confirmed email: " + email);
		return done(null, false, { message: `User's email is not confirmed`, reason: "unconfirmed email", userId: user.id, callsign: user.callsign })
	}
	/*
	if (user.terms != 1.1) {
		console.error("Auth Error - user has not accepted TOS: " + email);
		return done(null, false, { message: `User has not accepted the Terms of Service`, reason: "unaccepted TOS"})
	}*/
	user.comparePassword(password, (err, isMatch) => {
		if (isMatch) {
			return done(null, user)
		} else {
			console.error("Auth Error - password mismatch: " + email);
			// userId is carried so the audit trail can tell "wrong password on a
			// real account" apart from "no such account". The message the user
			// sees stays identical either way.
			return done(null, false, { message: "Invalid email or password", reason: "bad password", userId: user.id, callsign: user.callsign })
		}
	})
})
module.exports = local;