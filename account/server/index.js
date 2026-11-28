const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");
const secrets = require("./config/secrets");
const configurePassport = require("./config/passport");
const configureExpress = require("./config/express");
const registerRoutes = require("./lib/routes");
const { wrap, errorHandler, installProcessHandlers } = require("./lib/safety");

installProcessHandlers("account");
require("./models/user");

// -------------------------------------------

const app = express()

// -------------------------------------------

mongoose.connection.on('connecting', () => console.log('Mongoose is connecting'));
mongoose.connection.on('connected', () => console.log('Mongoose is connected'));
mongoose.connection.on('disconnecting', () => console.log('Mongoose is disconnecting'));
mongoose.connection.on('error', err => console.error("Mongoose Error! " + err));

// Retry until Mongo is reachable. Listeners are registered once, above; they
// used to be added again on every reconnect.
let connecting = false;
async function connect() {
  if (connecting || mongoose.connection.readyState !== 0) return;
  connecting = true;
  try {
    // Indexes are created by mongo/db.sh, not by Mongoose at startup (an index
    // added to a model would otherwise start a build on 80M+ calls at deploy).
    await mongoose.connect(secrets.db, { autoIndex: false });
  } catch (err) {
    console.error("Mongo connect failed, retrying in 5s: " + ((err && err.message) || err));
    setTimeout(connect, 5000);
  } finally {
    connecting = false;
  }
}
connect();
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
  setTimeout(connect, 1000);
});

// -------------------------------------------

const isDev = process.env.NODE_ENV === "development"




var frontend_server = process.env['REACT_APP_FRONTEND_SERVER'] != null ? process.env['REACT_APP_FRONTEND_SERVER'] : 'https://openmhz.com';
var account_server = process.env['REACT_APP_ACCOUNT_SERVER'] != null ? process.env['REACT_APP_ACCOUNT_SERVER'] : 'https://account.openmhz.com'; 
var admin_server = process.env['REACT_APP_ADMIN_SERVER'] != null ? process.env['REACT_APP_ADMIN_SERVER'] : 'https://admin.openmhz.com'; 


// -------------------------------------------

configurePassport(app, passport)
configureExpress(app, passport)


app.all('*', function (req, res, next) {
	var allowedOrigins = [account_server, admin_server, frontend_server];
	var origin = req.headers.origin;
	if (allowedOrigins.indexOf(origin) > -1) {
		res.setHeader('Access-Control-Allow-Origin', origin);
	}
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

// -------------------------------------------
app.use(express.static(path.join(__dirname, "public")));
registerRoutes(app)

app.get("*", wrap((req, res, next) => {
	res.sendFile(__dirname + '/public/index.html');
}));

app.use(errorHandler);


// start listening to incoming requests
app.listen(app.get("port"), app.get("host"), (err) => {
	if (err) {
		console.error(err.stack)
	} else {
		console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
	}
})
