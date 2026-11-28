const passport = require("passport");
const User = require("../models/user");
const Mailjet = require('node-mailjet');

const mongoose = require("mongoose");
const crypto = require("crypto");
const { findUserByEmail } = require("../lib/email");

var admin_email = process.env['REACT_APP_ADMIN_EMAIL'] != null ? process.env['REACT_APP_ADMIN_EMAIL'] : "support@openmhz.com";
var site_name = process.env['REACT_APP_SITE_NAME'] != null ? process.env['REACT_APP_SITE_NAME'] : "OpenMHz";
var account_server = process.env['REACT_APP_ACCOUNT_SERVER'] != null ? process.env['REACT_APP_ACCOUNT_SERVER'] : "https://account.openmhz.com";
var cookie_domain = process.env['REACT_APP_COOKIE_DOMAIN'] != null ? process.env['REACT_APP_COOKIE_DOMAIN'] : '.openmhz.com'; 


let mailjet = new Mailjet({
  apiKey: process.env['MAILJET_KEY'],
  apiSecret: process.env['MAILJET_SECRET']
});

// test hook: replace the Mailjet client (never used in production code paths)
exports._setMailjet = function (client) {
  mailjet = client;
};

exports.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  // The React client calls these endpoints with fetch() and parses JSON, so a
  // redirect to the /login HTML page is useless to it. Only browser page
  // navigations (GET accepting HTML, outside /api) are still redirected.
  const wantsJson = req.xhr ||
    (req.originalUrl || "").startsWith("/api") ||
    (req.headers.accept || "").includes("application/json") ||
    req.method !== "GET";
  if (wantsJson) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  res.redirect("/login");
};

// -------------------------------------------


exports.authenticated = function (req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  if (req.isAuthenticated()) {
    var clientUser = (({
      firstName,
      lastName,
      screenName,
      location,
      email,
      admin,
      terms
    }) => ({
      firstName,
      lastName,
      screenName,
      location,
      email,
      admin,
      terms
    }))(
      req.user
    );
    clientUser.userId = req.user.id

    return res.json({
      success: true,
      user: clientUser
    });

  } else {
    return res.json({
      success: false
    });
  }
}

exports.login = function (req, res, next) {
  // Do email and password validation for the server

  passport.authenticate("local", function (err, user, info) {
    if (err) return next(err);
    if (!user) {
      console.log("No user");
      return res.json({
        success: false,
        message: info && info.message,
        reason: info && info.reason,
        // only set for reason "unconfirmed email" (after a correct password)
        ...(info && info.userId ? { userId: info.userId, email: info.email } : {})
      });
    }
    // ***********************************************************************
    // "Note that when using a custom callback, it becomes the application's
    // responsibility to establish a session (by calling req.login()) and send
    // a response."
    // Source: http://passportjs.org/docs
    // ***********************************************************************
    // Passport exposes a login() function on req (also aliased as logIn())
    // that can be used to establish a login session
    req.login(user, loginErr => {

      if (loginErr) {
        console.error("Login error: " + (loginErr && loginErr.stack || loginErr))
        return res.status(500).json({
          success: false,
          message: "Login failed"
        });
      }
      if (!user.confirmEmail) {
        return req.logout(function (err) {
          if (err) { return next(err); }
          res.clearCookie('sessionId', { domain: cookie_domain, path: '/' });
          return res.json({
            success: false,
            message: "unconfirmed email",
            reason: "unconfirmed email",
            userId: user.id,
            email: user.email
          });
        });
      }
      //console.log("account/server/controllers/users.js - req.login() Authenicated: " + user.email);
      // go ahead and create the new user
      var clientUser = (({
        firstName,
        lastName,
        screenName,
        location,
        email,
        admin,
        terms
      }) => ({
        firstName,
        lastName,
        screenName,
        location,
        email,
        admin,
        terms
      }))(
        user
      );
      clientUser.userId = user.id
      return res.json({
        success: true,
        message: "authentication succeeded",
        user: clientUser,
        userId: user.id
      });
    });
  })(req, res, next);
};

// -------------------------------------------
// helpers

const MIN_PASSWORD_LENGTH = 7;

const isDuplicateKeyError = (err) => !!err && (err.code === 11000 || err.code === 11001);

const sendNotFound = (res, message) => {
  res.status(404);
  res.json({
    success: false,
    message: message || "User not found"
  });
};

// Resolves to a user document, or null for an invalid / unknown id.
const findUserById = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }
  return User.findById(userId);
};

exports.confirmEmail = async function (req, res, next) {
  const userId = req.params["userId"];
  const token = req.params["token"];

  const user = await findUserById(userId);

  if (!user) {
    console.error("User not found: " + userId);
    return sendNotFound(res, "User not found");
  }
  if (user.confirmEmail) {
    console.log("User already confirmed email: " + userId);
    res.status(500);
    res.json({
      success: false,
      message: "already confirmed email"
    });
    return;
  }
  const today = new Date();
  if (user.confirmEmailTTL < today) {
    res.status(500);
    console.error("Expired token for confirming email: " + userId);
    res.json({
      success: false,
      message: "token expired"
    });
    return;
  }
  if (user.confirmEmailToken != token) {
    res.status(500);
    console.error("Token Mismatch confirming email for user: " + userId);
    res.json({
      success: false,
      message: "token mismatch"
    });
    return;
  }
  user.confirmEmail = true;
  user.confirmEmailToken = "";
  await user.save();

  console.log("User: " + user.email + " confirmed email address");
  res.json({
    success: true
  });
};


exports.resetPassword = async function (req, res, next) {
  const userId = req.params["userId"];
  const token = req.params["token"];

  const user = await findUserById(userId);

  if (!user) {
    console.error("User not found: " + userId);
    return sendNotFound(res, "User not found");
  }
  const today = new Date();
  if (user.resetPasswordTTL < today) {
    res.status(500);
    res.json({
      success: false,
      message: "token expired"
    });
    return;
  }
  if (user.resetPasswordToken != token) {
    console.log("Token Mismatch resetting password for user: " + userId);
    res.status(500);
    res.json({
      success: false,
      message: "token mismatch"
    });
    return;
  }

  const password = req.body && req.body.password;
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    res.status(400);
    res.json({
      success: false,
      message: "Password must be " + MIN_PASSWORD_LENGTH + " characters or more"
    });
    return;
  }

  user.password = password;
  user.confirmEmail = true;
  user.confirmEmailToken = "";
  user.resetPasswordToken = "";
  await user.save();
  res.json({
    success: true
  });
};


// -------------------------------------------
exports.sendResetPassword = async function (req, res, next) {
  const email = req.body && req.body.email;
  if (typeof email !== "string" || !email.trim()) {
    res.status(400);
    res.json({
      success: false,
      message: "Email is required"
    });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    console.error("Reset password failed. No user: " + email);
    res.status(404);
    res.json({
      success: false,
      message: "No account registered for " + email
    });
    return;
  }
  const buffer = crypto.randomBytes(20);
  const token = buffer.toString("hex");
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  user.resetPasswordToken = token;
  user.resetPasswordTTL = tomorrow;
  await user.save();

  try {
    await mailjet.post("send", {
      version: "v3.1"
    }).request({
      Messages: [{
        From: {
          Email: admin_email,
          Name: site_name + " Admin"
        },
        To: [{
          Email: user.email,
          Name: user.firstName + " " + user.lastName
        }],
        Subject: site_name + " - Password Reset",
        TextPart: "It looks like you may have forgot your password. Copy this link to your browser to reset your password. Let us know if you are receiving this but did not request a password reset. " + account_server + "/reset-password/" + user.id + "/" + token,
        HTMLPart: "<h3>Thanks for using " + site_name + "!</h3><br />It looks like you may have forgot your password. Copy this link to your browser to reset your password. Let us know if you are receiving this but did not request a password reset.<p>" + account_server + "/reset-password/" + user.id + "/" + token + "</p>"
      }]
    });
    console.log(`Password reset sent to: ${user.email}`);
  } catch (err) {
    console.error("Error sending password reset email: " + (err && err.statusCode));
    console.error(err);
    res.status(500);
    res.json({
      success: false,
      message: "Unable to send password reset email"
    });
    return;
  }
  res.json({
    success: true
  });
};

const CONFIRM_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

// Resolves {success:true,userId}. Rejects with an Error whose message is a
// string; err.status is the HTTP status the caller should use.
async function handleSendConfirmEmail(user) {
  if (user.confirmEmail) {
    console.log("Error - Send Confirm Email - User already confirmed email: " + user.email);
    const err = new Error("already confirmed email");
    err.status = 200; // historical behaviour: success:false with HTTP 200
    throw err;
  }

  // confirmEmailTTL is set to (send time + 24h) whenever a token is generated,
  // so it tells us when the last confirmation email went out.
  const previousTTL = user.confirmEmailTTL;
  if (previousTTL) {
    const age = Date.now() - (new Date(previousTTL).getTime() - CONFIRM_TOKEN_LIFETIME_MS);
    if (age >= 0 && age < RESEND_COOLDOWN_MS) {
      const err = new Error("A confirmation email was just sent. Please wait a minute before requesting another.");
      err.status = 429;
      throw err;
    }
  }

  const buffer = crypto.randomBytes(20);
  const token = buffer.toString("hex");
  user.confirmEmailToken = token;
  user.confirmEmailTTL = new Date(Date.now() + CONFIRM_TOKEN_LIFETIME_MS);
  await user.save();
  const confirmUrl = account_server + "/confirm-email/" + user._id + "/" + token;
  try {
    await mailjet.post("send", {
      version: "v3.1"
    }).request({
      Messages: [{
        From: {
          Email: admin_email,
          Name: site_name + " Admin"
        },
        To: [{
          Email: user.email,
          Name: user.firstName + " " + user.lastName
        }],
        Subject: "Confirm " + site_name + " Account",
        TextPart: "Thanks for signing up for " + site_name + ". We just wanted to check and make sure your email address was real. Copy and paste this address in your browser to confirm your email address: " + confirmUrl,
        HTMLPart: "<h3>Thanks for signing up for " + site_name + "</h3><br />We just wanted to check and make sure your email address was real. Click this link to confirm your email address:<p><a href=\"" + confirmUrl + "\">" + confirmUrl + "</a></p>"
      }]
    });
  } catch (cause) {
    console.error("Admin Email: " + admin_email + " User Email: " + user.email);
    console.error("Error - Send Confirm Email - caught: " + cause);
    // Nothing was sent, so don't let the cooldown block an immediate retry.
    user.confirmEmailTTL = previousTTL;
    try { await user.save(); } catch (e) { console.error("Could not reset confirmEmailTTL: " + e); }
    const err = new Error("Unable to send confirmation email");
    err.status = 500;
    throw err;
  }
  console.log("Confirm email sent to: " + user.email);
  return {
    success: true,
    userId: user._id
  };
}

// -------------------------------------------
exports.sendConfirmEmail = async function (req, res, next) {
  const userId = req.params["userId"];
  const user = await findUserById(userId);
  if (!user) {
    console.error("Error - Send Confirm Email: User not found " + userId);
    return sendNotFound(res, "user not found");
  }
  let result;
  try {
    result = await handleSendConfirmEmail(user);
  } catch (err) {
    if (!err.status) throw err; // unexpected (e.g. DB) failure -> errorHandler
    res.status(err.status);
    res.json({ success: false, message: err.message });
    return;
  }
  res.json(result);
}



// -------------------------------------------

exports.logout = function (req, res, next) {
  // the logout method is added to the request object automatically by Passport
  req.logout(function (err) {
    if (err) { return next(err); }

    res.clearCookie('sessionId', { domain: cookie_domain, path: '/' });
    return res.json({
      success: true
    });
  });
};

exports.terms = async function (req, res, next) {
  const userId = req.params["userId"];

  if (req.user.id != userId) {
    console.log(
      "Logged in user's ID: " +
      req.user.id +
      " does not match Param: " +
      userId
    );
    res.status(500);
    res.json({
      success: false,
      message: "UserID incorrect"
    });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    return sendNotFound(res, "User not found");
  }

  user.terms = 1.1; //User.termsVer;
  await user.save();
  var clientUser = (({
    terms
  }) => ({
    terms
  }))(
    user
  );
  res.json({
    success: true,
    user: clientUser
  });
  return;
}
// -------------------------------------------

const sendBadRequest = (res, message) => {
  res.status(400);
  res.json({
    success: false,
    message
  });
};

// Names and locations: any Unicode letter/mark/digit plus space . , ' ` _ -
const NAME_DISALLOWED = /[^\p{L}\p{M}\p{N} .,'`_\-]/gu;

exports.validateProfile = function (req, res, next) {
  const body = req.body || {};
  console.log("Validating user profile: " + body.email);
  if (typeof body.firstName !== "string" || (body.firstName.length < 2)) {
    console.error("ERROR: Validate System - req.body.firstName");
    return sendBadRequest(res, "First Name is Required");
  }
  res.locals.firstName = body.firstName.replace(NAME_DISALLOWED, '');

  if (typeof body.lastName !== "string" || (body.lastName.length < 2)) {
    console.error("ERROR: Validate System - req.body.lastName");
    return sendBadRequest(res, "Last Name is Required");
  }
  res.locals.lastName = body.lastName.replace(NAME_DISALLOWED, '');

  if (typeof body.screenName !== "string") {
    console.error("ERROR: Validate System - req.body.screenName");
    return sendBadRequest(res, "Screen Name is Required");
  }
  // This is the value that is both checked for uniqueness and stored
  // (the schema lowercases it on save).
  res.locals.screenName = body.screenName.replace(/[^\w\s\.\,\-\_]/gi, '').toLowerCase();
  if (!res.locals.screenName) {
    console.error("ERROR: Validate System - req.body.screenName");
    return sendBadRequest(res, "Screen Name is Required");
  }

  if (typeof body.location !== "string" || (body.location.length < 2)) {
    console.error("ERROR: Validate System - req.body.location");
    return sendBadRequest(res, "System location is Required");
  }
  res.locals.location = body.location.replace(NAME_DISALLOWED, '');

  next();
}

exports.updateProfile = async function (req, res, next) {
  const userId = req.params["userId"];

  if (req.user.id != userId) {
    console.log(
      "ERROR: Logged in user's ID: " +
      req.user.id +
      " does not match Param: " +
      userId
    );
    res.json({
      success: false,
      message: "UserID incorrect"
    });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    return sendNotFound(res, "User not found");
  }

  // Lets make sure someone else isn't using this screenName. Only check when it
  // changes: some existing accounts already share a name, and they must still
  // be able to save the rest of their profile.
  const screenNameChanged = String(user.screenName || "").toLowerCase() !== res.locals.screenName;
  const screenNameUser = screenNameChanged ? await User.findOne({ screenName: res.locals.screenName }) : null;

  // Did we find a user with the screeName, is it not us?
  if (screenNameUser && !screenNameUser._id.equals(user._id)) {
    res.status(500);
    res.json({
      success: false,
      message: "Screen Name already in use"
    });
    return;
  }

  user.firstName = res.locals.firstName
  user.lastName = res.locals.lastName
  user.screenName = res.locals.screenName
  user.location = res.locals.location

  try {
    await user.save();
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      res.status(500);
      res.json({
        success: false,
        message: "Screen Name already in use"
      });
      return;
    }
    throw err;
  }
  var clientUser = (({
    firstName,
    lastName,
    screenName,
    location
  }) => ({
    firstName,
    lastName,
    screenName,
    location
  }))(
    user
  );
  console.log("Updated Profile: " + userId)
  res.json({
    success: true,
    user: clientUser
  });
  return;
};
// -------------------------------------------

exports.register = async function (req, res, next) {
  const body = req.body || {};
  console.log("Registration request for: " + body.email);

  if (typeof body.email !== "string" || !body.email.trim()) {
    return sendBadRequest(res, "Email is Required");
  }
  if (typeof body.password !== "string" || body.password.length < MIN_PASSWORD_LENGTH) {
    return sendBadRequest(res, "Password must be " + MIN_PASSWORD_LENGTH + " characters or more");
  }
  const email = body.email.trim();

  // is email address already in use?
  const existingEmailUser = await findUserByEmail(email);
  if (existingEmailUser) {
    res.status(500);
    res.json({
      success: false,
      message: "Email already in use"
    });
    return;
  }
  // is screen name already in use? (same sanitized value that gets stored)
  const existingScreenNameUser = await User.findOne({ screenName: res.locals.screenName });
  if (existingScreenNameUser) {
    res.status(500);
    res.json({
      success: false,
      message: "Screen Name already in use"
    });
    return;
  }
  // go ahead and create the new user
  const newUser = {
    firstName: res.locals.firstName,
    lastName: res.locals.lastName,
    screenName: res.locals.screenName,
    location: res.locals.location,
    password: body.password,
    email: email
  };

  let savedUser;
  try {
    savedUser = await User.create(newUser);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      const emailDup = err.keyPattern ? ("email" in err.keyPattern) : /email/.test(err.message || "");
      res.status(500);
      res.json({
        success: false,
        message: emailDup ? "Email already in use" : "Screen Name already in use"
      });
      return;
    }
    throw err;
  }

  console.log("Successfully registered: " + email + ", now sending confirmation email.");
  // Since registration worked, send a confirmation email.
  try {
    await handleSendConfirmEmail(savedUser);
  } catch (err) {
    console.error("Error sending confirmation email to new user: " + email + " Error: " + err.message);
    // The account exists, so report success and let the client offer "Resend".
    res.json({
      success: true,
      userId: savedUser.id,
      email: savedUser.email,
      emailSent: false
    });
    return;
  }
  console.log("Confirmation email sent to: " + email);
  res.json({
    success: true,
    message: { success: true, userId: savedUser._id },
    userId: savedUser.id,
    email: savedUser.email,
    emailSent: true
  });
}
