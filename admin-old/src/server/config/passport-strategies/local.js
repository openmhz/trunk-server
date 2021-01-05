/*
 Configuring local strategy to authenticate strategies
 Code modified from : https://github.com/madhums/node-express-mongoose-demo/blob/master/config/passport/local.js
 */

 import mongoose from "mongoose"
 import { Strategy as LocalStrategy } from "passport-local"
 import User from "../../models/user"

 /*
 By default, LocalStrategy expects to find credentials in parameters named username and password.
 If your site prefers to name these fields differently, options are available to change the defaults.
 */
 export default new LocalStrategy({
 	usernameField: "email"
 }, (email, password, done) => {
 	User.findOne({
    $or: [{
      email
    }, {
      local: {
        email
      }
    }]
  }, (err, user) => {
 		if(!user) return done(null, false, { message: `Email ${email} not found` })

 		user.comparePassword(password, (err, isMatch) => {
 			if (isMatch) {
 				return done(null, user)
 			} else {
 				return done(null, false, { message: "Invalid email or password" })
 			}
 		})
 	})
 })
