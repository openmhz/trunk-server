import fs from "fs"
import mongoose from "mongoose"
import express from "express"
import passport from "passport"
import webpack from "webpack"
import path from "path"
import config from "../../webpack/webpack.config.dev.js"
import secrets from "./config/secrets"
import configurePassport from "./config/passport"
import configureExpress from "./config/express"
import systems from "./controllers/systems"
import groups from "./controllers/groups"
import permissions from "./controllers/permissions"
import talkgroups from "./controllers/talkgroups"

import Permission from "./models/permission";
import "./models/user"
import multer from 'multer'
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

// if in development mode set up the middleware required for hot reloading and rebundling
if(isDev) {

	const compiler = webpack(config)

	app.use(require("webpack-dev-middleware")(compiler, {
		noInfo: true,
		publicPath: config.output.publicPath
	}))

	app.use(require("webpack-hot-middleware")(compiler))
}
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


var admin_server = process.env['ADMIN_SERVER'] != null ? process.env['ADMIN_SERVER'] : 'https://admin.openmhz.com';
var admin_email = process.env['ADMIN_EMAIL'] != null ? process.env['ADMIN_EMAIL'] : "luke@openmhz.com";
var beta_frontend_server = process.env['BETA_FRONTEND_SERVER'] != null ? process.env['BETA_FRONTEND_SERVER'] : 'https://beta.openmhz.com';
var backend_server = process.env['BACKEND_SERVER'] != null ? process.env['BACKEND_SERVER'] : 'https://api.openmhz.com';
var frontend_server = process.env['FRONTEND_SERVER'] != null ? process.env['FRONTEND_SERVER'] : 'https://openmhz.com';
var socket_server = process.env['SOCKET_SERVER'] != null ? process.env['SOCKET_SERVER'] : 'wss://api.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var account_server = process.env['ACCOUNT_SERVER'] != null ? process.env['ACCOUNT_SERVER'] : 'https://account.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var site_name = process.env['SITE_NAME'] != null ? process.env['SITE_NAME'] : "OpenMHz";
const proPlanValue = process.env['PRO_PLAN'] != null ? process.env['PRO_PLAN'] : 10;
const freePlanValue = process.env['FREE_PLAN'] != null ? process.env['FREE_PLAN'] : 0;
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

	// if we are in production mode then an extension will be provided, usually ".min"
	const minified = process.env.MIN_EXT || ""

	// this is the HTML we will send to the client when they request any page. React and React Router
	// will take over once the scripts are loaded client-side
	const appHTML =
	`<!doctype html>
	<html lang="">
	<head>
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
		<title>${site_name} Admin</title>
		<meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="/style/style.css"></link>
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.1/dist/semantic.min.css" />
    <script>
      const admin_server = "${admin_server}";
      const backend_server = "${backend_server}";
      const socket_server = "${socket_server}";
      const account_server = "${account_server}";
      const site_name = "${site_name}";
      const admin_email = "${admin_email}";
			const proPlanValue = ${proPlanValue};
			const freePlanValue = ${freePlanValue};
    </script>
		<style>
			body {
				font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
			}
		</style>
	</head>
	<body>
		<div id="app"></div>
		<script src="/assets/app${minified}.js"></script>
	</body>
	</html>`

	res.status(200).end(appHTML)

})

// start listening to incoming requests
app.listen(app.get("port"), app.get("host"), (err) => {
	if (err) {
		console.err(err.stack)
	} else {
		console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
	}
})
