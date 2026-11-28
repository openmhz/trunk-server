/*
 Configuring local strategy to authenticate strategies
 Code modified from : https://github.com/madhums/node-express-mongoose-demo/blob/master/config/passport/local.js
 */

const LocalStrategy = require("passport-local").Strategy;
const { findUserByEmail } = require("../../lib/email");
/*
By default, LocalStrategy expects to find credentials in parameters named username and password.
If your site prefers to name these fields differently, options are available to change the defaults.
*/
const local = new LocalStrategy({
	usernameField: "email"
}, async (email, password, done) => {
	try {
		if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
			return done(null, false, { message: `Invalid email or password`, reason: "invalid" })
		}
		const user = await findUserByEmail(email);
		if (!user) {
			console.error("Auth Error - user not found: " + email);
			return done(null, false, { message: `Invalid email or password`, reason: "invalid" })
		}
		user.comparePassword(password, (err, isMatch) => {
			if (err) return done(err)
			if (!isMatch) {
				console.error("Auth Error - password mismatch: " + email);
				return done(null, false, { message: "Invalid email or password", reason: "invalid"})
			}
			// Only someone who knows the password learns the email is unconfirmed
			// (and gets the id needed to resend the confirmation email).
			if (!user.confirmEmail) {
				console.error("Auth Error - user has not confirmed email: " + email);
				return done(null, false, {
					message: "User's email is not confirmed",
					reason: "unconfirmed email",
					userId: user.id,
					email: user.email
				})
			}
			return done(null, user)
		})
	} catch (err) {
		return done(err)
	}
})
module.exports = local;
