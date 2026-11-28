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
const { wrap, errorHandler, installProcessHandlers, connectWithRetry } = require("@openmhz/shared");

installProcessHandlers("admin");

require("./models/user");
const multer = require('multer');

var upload = multer({
  dest: 'uploads/'
});
// -------------------------------------------

const app = express()

// -------------------------------------------

// -------------------------------------------

connectWithRetry(mongoose, secrets.db, {}, { name: "admin" });
// -------------------------------------------

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).send({
    success: false,
    message: "Not Authenticated."
  });
};


function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.admin) return next();
  res.status(401).send({
    success: false,
    message: "Not Authenticated."
  });
};


function uploadFile(req, res, next) {
  const upload = multer({ dest: 'uploads/' }).single('file');

  upload(req, res, function (err) {
    if (err) {
      console.error("Upload error: " + (err.stack || err));
      // The client displays this body as plain text.
      const message = (err instanceof multer.MulterError)
        ? "File upload failed: " + err.message
        : "File upload failed. Please try again.";
      return res.status(400).send(message);
    }
    next();
  })
}

// -------------------------------------------

configurePassport(app, passport)
configureExpress(app, passport)

// -------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

app.get("/talkgroups/:shortName", wrap(isLoggedIn), wrap(talkgroups.fetchTalkgroups))
app.post("/talkgroups/:shortName/import", wrap(isLoggedIn), uploadFile, wrap(talkgroups.importTalkgroups))
app.get("/talkgroups/:shortName/export", wrap(isLoggedIn), wrap(talkgroups.exportTalkgroups))
app.post("/groups/:shortName/reorder", wrap(isLoggedIn), wrap(groups.reorderGroups));
app.post("/groups/:shortName/:groupId?", wrap(isLoggedIn), wrap(groups.upsertGroup));
app.get("/groups/:shortName/:groupId?", wrap(isLoggedIn), wrap(groups.getGroups));
app.delete("/groups/:shortName/:groupId", wrap(isLoggedIn), wrap(groups.deleteGroup));
app.get("/systems", wrap(isLoggedIn), wrap(systems.listSystems))
app.get("/admin/systems", wrap(isAdmin), wrap(systems.listAllSystems))
app.get("/admin/users/active", wrap(isAdmin), wrap(systems.listActiveUsers))
app.get("/admin/users", wrap(isAdmin), wrap(systems.listUserSystems))
app.delete("/systems/:shortName", wrap(isLoggedIn), wrap(systems.deleteSystem))
app.post("/systems/:shortName", [wrap(isLoggedIn), wrap(systems.ownSystem), wrap(systems.validateSystem), wrap(systems.updateSystem)])
app.post("/systems/:shortName/key", wrap(isLoggedIn), wrap(systems.regenerateKey))
app.post("/systems", [wrap(isLoggedIn), wrap(systems.uniqueShortName), wrap(systems.validateSystem), wrap(systems.createSystem)])

app.get("*", (req, res, next) => {
  res.sendFile(__dirname + '/public/index.html');
});

// must be registered after all routes
app.use(errorHandler);

// start listening to incoming requests
app.listen(app.get("port"), app.get("host"), (err) => {
  if (err) {
    console.error(err.stack)
  } else {
    console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
  }
})
