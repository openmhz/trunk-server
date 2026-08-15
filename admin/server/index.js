const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const path = require("path");
const secrets = require("./config/secrets");
const configurePassport = require("./config/passport");
const configureExpress = require("./config/express");
const systems = require("./controllers/systems");
const groups = require("./controllers/groups");
const talkgroups = require("./controllers/talkgroups");
const users = require("./controllers/users");

require("./models/user");
require("./models/login_event");
const multer = require('multer');

var upload = multer({
  dest: 'uploads/'
});
// -------------------------------------------

const app = express()

// -------------------------------------------

// -------------------------------------------

async function connect() {

  // Demonstrate the readyState and on event emitters
  console.log(mongoose.connection.readyState); //logs 0
  mongoose.connection.on('connecting', () => {
    console.log('Mongoose is connecting')
    console.log(mongoose.connection.readyState); //logs 2
  });
  mongoose.connection.on('connected', () => {
    console.log('Mongoose is connected');
    console.log(mongoose.connection.readyState); //logs 1
  });
  mongoose.connection.on('disconnecting', () => {
    console.log('Mongoose is disconnecting');
    console.log(mongoose.connection.readyState); // logs 3
  });

  // Connect to a MongoDB server running on 'localhost:27017' and use the
  // 'test' database.
  await mongoose.connect(secrets.db, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("All Done");
}
connect();
mongoose.connection.on('error', err => {
  console.error("Mongoose Error!")
  console.error(err);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
  console.log(mongoose.connection.readyState); //logs 0
  connect();
});
// -------------------------------------------

function isOwner(req, res, next) {
  if (req.params.shortName && req.user) {
    var short_name = req.params.shortName.toLowerCase();
    var userId = req.user._id;
    Permission.findOne({ 'userId': userId, 'shortName': short_name }, function (err, permission) {
      if (err) {
        console.error('Error - getRole userId: ' + userId + ' shortName: ' + short_name + ' error: ' + err);
      }
      console.log('Found - getRole userId: ' + userId + ' shortName: ' + short_name + ' role: ' + permission.role);
      if (permission.role >= 15) {
        return next();
      } else {
        res.status(401).send({
          success: false,
          message: "Insufficent Permission, role: " + permission.role
        });
      }

    });
  }
}

/*
function isAdmin(req, res, next) {
  if (req.params.shortName && req.user) {
    var short_name = req.params.shortName.toLowerCase();
    var userId = req.user._id;
    Permission.findOne({ 'userId': userId, 'shortName': short_name }, function (err, permission) {
      if (err) {
        console.error('Error - getRole userId: ' + userId + ' shortName: ' + short_name + ' error: ' + err);
      }
      console.log('Found - getRole userId: ' + userId + ' shortName: ' + short_name + ' role: ' + permission.role);
      if (permission.role >= 10) {
        return next();
      } else {
        res.status(401).send({
          success: false,
          message: "Insufficent Permission, role: " + permission.role
        });
      }
    });
  }
}*/

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).send({
    success: false,
    message: "Not Authenticated."
  });
};


// Listener sessions roll for 30 days, which is far too long to leave
// administration open. Admin routes additionally require that the session was
// authenticated within the last 12 hours - session.loginAt is stamped by the
// account service at login.
const ADMIN_MAX_LOGIN_AGE_MS = 12 * 60 * 60 * 1000;

function isAdmin(req, res, next) {
  if (!req.isAuthenticated() || !req.user.admin) {
    return res.status(401).send({
      success: false,
      message: "Not Authenticated."
    });
  }

  const loginAt = req.session && req.session.loginAt;
  if (!loginAt || (Date.now() - loginAt) > ADMIN_MAX_LOGIN_AGE_MS) {
    return res.status(401).send({
      success: false,
      message: "Please sign in again to continue - admin sessions expire after 12 hours.",
      reason: "stale login"
    });
  }

  return next();
};


function uploadFile(req, res, next) {
  const upload = multer({dest: 'uploads/'}).single('file');

  upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
          console.error("Multer Error: " + err)
      } else if (err) {
          console.error(err);
          // An unknown error occurred when uploading.
      }
      console.log("Things look good for Multer")
      // Everything went fine. 
      next()
  })
}

// -------------------------------------------

configurePassport(app, passport)
configureExpress(app, passport)

// -------------------------------------------
app.use(express.static(path.join(__dirname, "public")));
app.get("")

app.get("/talkgroups/:shortName", isLoggedIn, talkgroups.fetchTalkgroups)
app.post("/talkgroups/:shortName/import", isLoggedIn, uploadFile, talkgroups.importTalkgroups)
app.get("/talkgroups/:shortName/export", isLoggedIn, talkgroups.exportTalkgroups)
app.post("/groups/:shortName/reorder", isLoggedIn, groups.reorderGroups);
app.post("/groups/:shortName/:groupId?", isLoggedIn, groups.upsertGroup);
app.get("/groups/:shortName/:groupId?", isLoggedIn, groups.getGroups);
app.delete("/groups/:shortName/:groupId", isLoggedIn, groups.deleteGroup);
app.get("/systems", isLoggedIn, systems.listSystems)
app.get("/admin/systems", isAdmin, systems.listAllSystems)
app.get("/admin/users/active", isAdmin, systems.listActiveUsers)
app.get("/admin/users", isAdmin, systems.listUserSystems)

// User administration. Named user-accounts rather than users because
// /admin/users above already means "users, with the systems they own", and the
// All Systems screen depends on it.
app.get("/admin/user-accounts", isAdmin, users.listUsers)
app.get("/admin/user-accounts/:userId", isAdmin, users.getUser)
app.post("/admin/user-accounts/:userId", isAdmin, users.updateUser)
app.delete("/admin/user-accounts/:userId", isAdmin, users.deleteUser)
app.post("/admin/user-accounts/:userId/resend-confirmation", isAdmin, users.resendConfirmation)
app.get("/admin/login-events", isAdmin, users.listLoginEvents)

app.delete("/systems/:shortName", isLoggedIn, systems.deleteSystem)
app.post("/systems/:shortName", [isLoggedIn, systems.ownSystem, systems.validateSystem, systems.updateSystem])
app.post("/systems", [isLoggedIn, systems.uniqueShortName, systems.validateSystem, systems.createSystem])

app.get("*", (req, res, next) => {
  res.sendFile(__dirname + '/public/index.html');
});

// start listening to incoming requests
app.listen(app.get("port"), app.get("host"), (err) => {
  if (err) {
    console.err(err.stack)
  } else {
    console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
  }
})
