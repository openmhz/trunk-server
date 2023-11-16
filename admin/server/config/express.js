const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const MongoStore = require("connect-mongo");
const secrets = require("./secrets");

var cookie_domain = process.env['REACT_APP_COOKIE_DOMAIN'] != null ? process.env['REACT_APP_COOKIE_DOMAIN'] : '.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var backend_server = process.env['REACT_APP_BACKEND_SERVER'] != null ? process.env['REACT_APP_BACKEND_SERVER'] : 'https://api.openmhz.com';
var frontend_server = process.env['REACT_APP_FRONTEND_SERVER'] != null ? process.env['REACT_APP_FRONTEND_SERVER'] : 'https://openmhz.com';
var account_server = process.env['REACT_APP_ACCOUNT_SERVER'] != null ? process.env['REACT_APP_ACCOUNT_SERVER'] : 'https://account.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var dev_server = "http://admin.openmhz.test:3000"

module.exports = function(app, passport) {
	app.set("port", 3008)

	// X-Powered-By header has no functional value.
	// Keeping it makes it easier for an attacker to build the site's profile
	// It can be removed safely
	app.disable("x-powered-by")
	app.enable('trust proxy')
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(express.static(path.join(process.cwd(), 'public')));

	const sess = {
		resave: false,
		saveUninitialized: false,
		secret: secrets.sessionSecret,
		proxy: true,
		name: "sessionId",
		cookie: {
			httpOnly: true,
			secure: false,
			domain: cookie_domain
		},
		store:  MongoStore.create({
			mongoUrl: secrets.db,
			autoReconnect: true,
			autoRemove: 'interval',
			autoRemoveInterval: 240,
			touchAfter: 24 * 3600 // time period in seconds
		})
	}

	var node_env = process.env.NODE_ENV;
	console.log('--------------------------');
	console.log('===> 😊  Starting Server . . .');
	console.log('===>  Environment: ' + node_env);
	
	if(node_env === 'production') {
		console.log('===> 🚦  Note: In order for authentication to work in production');
		console.log('===>           you will need a secure HTTPS connection');
		//sess.cookie.secure = true; // Serve secure cookies
	}

	app.use(session(sess))

	app.use(passport.initialize())
	app.use(passport.session())

	app.use('/*', function(req, res, next) {
	    var allowedOrigins = [ account_server];
	    allowedOrigins.push(frontend_server);
	    allowedOrigins.push(backend_server);
		allowedOrigins.push(dev_server);

	    var origin = req.headers.origin;

	    if (allowedOrigins.indexOf(origin) > -1) {
	        res.setHeader('Access-Control-Allow-Origin', origin);
	    } else if (req.headers["user-agent"] == 'TrunkRecorder1.0') {
	        res.setHeader('Access-Control-Allow-Origin', "*");
	    } else {
	        res.setHeader('Access-Control-Allow-Origin', "*");
	        if (origin) {
	          console.warn("forcing CORS for: " + origin + " referer: " + req.headers.referer);
	        }
	    }
	    res.header("Access-Control-Allow-Headers", "X-Requested-With");
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,WEBSOCKET');
		res.header('Access-Control-Allow-Credentials', 'true');
	    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Access-Control-Allow-Credentials, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Max-Age");
	    res.header('Access-Control-Max-Age', '600');
	    next();
	});
}
