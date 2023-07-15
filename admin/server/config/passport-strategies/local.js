/*
 Configuring local strategy to authenticate strategies
 Code modified from : https://github.com/madhums/node-express-mongoose-demo/blob/master/config/passport/local.js
 */

const mongoose = require("mongoose");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../../models/user");

 /*
 By default, LocalStrategy expects to find credentials in parameters named username and password.
 If your site prefers to name these fields differently, options are available to change the defaults.
 */
 module.exports = new LocalStrategy({
 	usernameField: "email"
 }, (email, password, done) => {
	// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex/6969486#6969486
	const escapeRegExp = (string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
 	User.findOne({
    $or: [{
		email: { '$regex': escapeRegExp(email), $options: 'i' } 
    }, {
      local: {
        email: { '$regex': escapeRegExp(email), $options: 'i' } 
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
