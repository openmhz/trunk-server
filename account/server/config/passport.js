/* Initializing PassportJS */
const User = require("../models/user");
const local = require("./passport-strategies/local");

module.exports = function (app, passport) {
  // Configure Passport authenticated session persistence.
  //
  // In order to restore authentication state across HTTP requests, Passport needs
  // to serialize users into and deserialize users out of the session.  The
  // typical implementation of this is as simple as supplying the user ID when
  // serializing, and querying the user record by ID from the database when
  // deserializing.
  passport.serializeUser((user, done) => {
  	done(null, user.id)
  })

  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id).exec();
    if (!user) {
      return done("User not found", null);
    }
    // Disabling an account has to take effect on the sessions it already has,
    // not just on the next login - sessions here last 30 days. done(null, false)
    // leaves req.user unset, so every isAuthenticated() check downstream fails.
    if (user.disabled) {
      return done(null, false);
    }
    done(null, user);
  })

  // use the following strategies
  passport.use(local)
}

