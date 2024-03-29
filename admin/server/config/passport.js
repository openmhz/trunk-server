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
    if (user) {
      done(null,user);
    } else {
      done("User not found", null);
    }
  })


  // use the following strategies
  passport.use(local)
}

