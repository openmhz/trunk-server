const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");
const secrets = require("./config/secrets");
const configurePassport = require("./config/passport");
const configureExpress = require("./config/express");
const users = require("./controllers/users");
require("./models/user");

// -------------------------------------------

const app = express()

// -------------------------------------------

const connect = async () => {

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
	await mongoose.connect(secrets.db, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => {

		console.error(`Mongoose - Error connecting to ${secrets.db}. ${err}`)

	});
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

const isDev = process.env.NODE_ENV === "development"




var frontend_server = process.env['REACT_APP_FRONTEND_SERVER'] != null ? process.env['REACT_APP_FRONTEND_SERVER'] : 'https://openmhz.com';
var account_server = process.env['REACT_APP_ACCOUNT_SERVER'] != null ? process.env['REACT_APP_ACCOUNT_SERVER'] : 'https://account.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var admin_server = process.env['REACT_APP_ADMIN_SERVER'] != null ? process.env['REACT_APP_ADMIN_SERVER'] : 'https://admin.openmhz.com'; //'https://s3.amazonaws.com/robotastic';


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
app.post("/login", users.login)
app.get("/logout", users.logout)
app.get("/authenticated", users.authenticated)
app.post("/register", users.validateProfile, users.register)
app.post("/users/:userId/reset-password/:token", users.resetPassword)
app.post("/api/send-reset-password", users.sendResetPassword)
app.post("/users/:userId", users.isLoggedIn, users.validateProfile, users.updateProfile)
app.post("/users/:userId/terms", users.isLoggedIn, users.terms)
app.post("/users/:userId/send-confirm", users.sendConfirmEmail)
app.post("/users/:userId/confirm/:token", users.confirmEmail)

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
