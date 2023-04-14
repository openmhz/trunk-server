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
	const user = await User.findOne({
		$or: [{
			email
		}, {
			local: {
				email
			}
		}]
	});
	if (!user) {
		console.error("Auth Error - user not found: " + email);
		return done(null, false, { message: `Invalid email or password` })
	}
	if (!user.confirmEmail) {
		console.error("Auth Error - user has not confirmed email: " + email);
		return done(null, false, { message: `User's email is not confirmed` })
	}
	user.comparePassword(password, (err, isMatch) => {
		if (isMatch) {
			return done(null, user)
		} else {
			console.error("Auth Error - password mismatch: " + email);
			return done(null, false, { message: "Invalid email or password" })
		}
	})
})
module.exports = local;