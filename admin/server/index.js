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
const Permission = require("./models/permission");
require("./models/user");
const multer = require('multer');

var upload = multer({
    dest: 'uploads/'
});
// -------------------------------------------

const app = express() 

// -------------------------------------------

const connect = () => {
	mongoose.connect(secrets.db, (err, res) => {
		if (err) {
			console.log(`Error connecting to ${secrets.db}. ${err}`)
		} else {
			console.log(`Successfully connected to ${secrets.db}.`)
		}
	})
}
connect()

mongoose.connection.on("error", console.error)
mongoose.connection.on("disconnected", connect)

// -------------------------------------------

const isDev = process.env.NODE_ENV === "development"


/*
async function getRole(req) {
  let promise = new Promise((resolve, reject) => {
    if (req.params.shortName && req.user) {
    var short_name = req.params.shortName.toLowerCase();
    var userId = req.user._id;
    Permission.findOne({'userId': userId, 'shortName': short_name}, function(err, permission) {
      if (err) {
        console.error('Error - getRole userId: ' + userId + ' shortName: ' + short_name + ' error: ' + err);
        reject(-1);
      }
      console.log('Found - getRole userId: ' + userId + ' shortName: ' + short_name + ' role: ' + permission.role);

      resolve(permission.role);
    });
  } else {
    reject(-1);
  }});
  return promise;
}*/



function isOwner(req, res, next) {
  if (req.params.shortName && req.user) {
    var short_name = req.params.shortName.toLowerCase();
    var userId = req.user._id;
    Permission.findOne({'userId': userId, 'shortName': short_name}, function(err, permission) {
      if (err) {
        console.error('Error - getRole userId: ' + userId + ' shortName: ' + short_name + ' error: ' + err);
      }
      console.log('Found - getRole userId: ' + userId + ' shortName: ' + short_name + ' role: ' + permission.role);
      if ( permission.role >= 15) {
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


function isAdmin(req, res, next) {
  if (req.params.shortName && req.user) {
    var short_name = req.params.shortName.toLowerCase();
    var userId = req.user._id;
    Permission.findOne({'userId': userId, 'shortName': short_name}, function(err, permission) {
      if (err) {
        console.error('Error - getRole userId: ' + userId + ' shortName: ' + short_name + ' error: ' + err);
      }
      console.log('Found - getRole userId: ' + userId + ' shortName: ' + short_name + ' role: ' + permission.role);
      if (permission.role  >= 10) {
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

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).send({
    success: false,
    message: "Not Authenticated."
  });
};

// -------------------------------------------

configurePassport(app, passport)
configureExpress(app, passport)

// -------------------------------------------
app.use(express.static(path.join(__dirname, "public")));
app.get("")

//app.get("/permissions/:shortname", isOwner, permissions.fetchPermissions)
/*app.get("/permissions/:shortName", permissions.fetchPermissions);
app.delete("/permissions/:shortName/:permissionId", isAdmin, permissions.deletePermission);
app.post("/permissions/:shortName/:permissionId", isAdmin, permissions.updatePermission);
app.post("/permissions/:shortName", isAdmin, permissions.addPermission);*/
app.get("/talkgroups/:shortName", isLoggedIn,  talkgroups.fetchTalkgroups)
app.post("/talkgroups/:shortName/import", isLoggedIn, upload.single('file'),  talkgroups.importTalkgroups)
app.get("/talkgroups/:shortName/export", isLoggedIn,  talkgroups.exportTalkgroups)
app.post("/groups/:shortName/reorder", isLoggedIn, groups.reorderGroups);
app.post("/groups/:shortName/:groupId?", isLoggedIn, groups.upsertGroup);
app.get("/groups/:shortName/:groupId?", isLoggedIn, groups.getGroups);
app.delete("/groups/:shortName/:groupId", isLoggedIn, groups.deleteGroup);
app.get("/systems", isLoggedIn,  systems.listSystems)
app.delete("/systems/:shortName", isLoggedIn, systems.deleteSystem)
app.post("/systems/:shortName", [isLoggedIn, systems.ownSystem, systems.validateSystem, systems.updateSystem])
app.post("/systems", [isLoggedIn, systems.uniqueShortName, systems.validateSystem, systems.createSystem])

app.get("*", (req, res, next) => {
	res.sendFile('public/index.html');
});

// start listening to incoming requests
app.listen(app.get("port"), app.get("host"), (err) => {
	if (err) {
		console.err(err.stack)
	} else {
		console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
	}
})
