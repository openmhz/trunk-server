/*
 Configuring local strategy to authenticate strategies
 Code modified from : https://github.com/madhums/node-express-mongoose-demo/blob/master/config/passport/local.js
 */

const LocalStrategy = require("passport-local").Strategy;
const User = require("../../models/user");
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
		return done(null, false, { message: `Invalid email or password`, reason: "invalid" })
	}
	if (!user.confirmEmail) {
		console.error("Auth Error - user has not confirmed email: " + email);
		return done(null, false, { message: `User's email is not confirmed`, reason: "unconfirmed email"})
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
			return done(null, false, { message: "Invalid email or password", reason: "invalid"})
		}
	})
})
module.exports = local;