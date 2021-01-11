const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const connectMongo = require("connect-mongo");
const secrets = require("./secrets");

const MongoStore = connectMongo(session)
var cookie_domain = process.env['COOKIE_DOMAIN'] != null ? process.env['COOKIE_DOMAIN'] : '.openmhz.com'; //'https://s3.amazonaws.com/robotastic';


module.exports = function(app, passport) {
	app.set("port", 3009)

	// X-Powered-By header has no functional value.
	// Keeping it makes it easier for an attacker to build the site's profile
	// It can be removed safely
	app.disable("x-powered-by")
	app.enable('trust proxy')
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(express.static(path.join(process.cwd(), 'public')));

	const sess = {
		secret: 'secret',
		/*saveUninitialized: false,
		resave: false,*/
		resave: true,
		saveUninitialized: true,
		secret: secrets.sessionSecret,
		proxy: true,
		name: "sessionId",
		cookie: {
			httpOnly: true,
			secure: false,
			domain: cookie_domain
		},
		store: new MongoStore({
			url: secrets.db,
			autoReconnect: true
		})
	}

	var node_env = process.env.NODE_ENV;
	console.log('--------------------------');
	console.log('===> 😊  Starting Server . . .');
	console.log('===>  Environment: ' + node_env);
	/*if(node_env === 'production') {
		console.log('===> 🚦  Note: In order for authentication to work in production');
		console.log('===>           you will need a secure HTTPS connection');
		sess.cookie.secure = true; // Serve secure cookies
		sess.cookie.httpOnly = false;
	}*/

	app.use(session(sess))

	app.use(passport.initialize())
	app.use(passport.session())

}
