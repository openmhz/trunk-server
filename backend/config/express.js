var path = require("path");
var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var connectMongo = require("connect-mongo");
var secrets = require("./secrets");

const MongoStore = connectMongo(session)
var cookie_domain = process.env['COOKIE_DOMAIN'] != null ? process.env['COOKIE_DOMAIN'] : '.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var backend_server = process.env['BACKEND_SERVER'] != null ? process.env['BACKEND_SERVER'] : 'https://api.openmhz.com';
var frontend_server = process.env['FRONTEND_SERVER'] != null ? process.env['FRONTEND_SERVER'] : 'https://openmhz.com';
var socket_server = process.env['SOCKET_SERVER'] != null ? process.env['SOCKET_SERVER'] : 'wss://socket.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var admin_server = process.env['ADMIN_SERVER'] != null ? process.env['ADMIN_SERVER'] : 'https://admin.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var site_name = process.env['SITE_NAME'] != null ? process.env['SITE_NAME'] : "OpenMHz";


module.exports = function(app, passport) {
	app.set("port", 3005)
	//app.set('trust proxy', true);
	// X-Powered-By header has no functional value.
	// Keeping it makes it easier for an attacker to build the site's profile
	// It can be removed safely
	app.disable("x-powered-by")

	app.use('/audio', express.static(__dirname + '/media'));
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(express.static(path.join(process.cwd(), 'public')));


	const sess = {
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
	if(node_env === 'production') {
		console.log('===> 🚦  Note: In order for authentication to work in production');
		console.log('===>           you will need a secure HTTPS connection');
		sess.cookie.secure = true; // Serve secure cookies
	}

	app.use(session(sess))

	app.use(passport.initialize())
	app.use(passport.session())


	app.use('/*', function(req, res, next) {
	    var allowedOrigins = [ admin_server];
	    allowedOrigins.push(frontend_server);
	    allowedOrigins.push(backend_server);
		allowedOrigins.push(socket_server);
		allowedOrigins.push("https://www.openmhz.com");

	    var origin = req.headers.origin;


	    if (allowedOrigins.indexOf(origin) > -1) {
	        res.setHeader('Access-Control-Allow-Origin', origin);
	    } else if (req.headers["user-agent"] == 'TrunkRecorder1.0') {
	        res.setHeader('Access-Control-Allow-Origin', "*");
	    } else {
	        res.setHeader('Access-Control-Allow-Origin', "*");
	        if (origin) {
	          console.warn("forcing CORS for: " + origin + " referer: " + req.headers.referer + " url: " + req.originalUrl);
	        }
	    }
	    res.header("Access-Control-Allow-Headers", "X-Requested-With");
	    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,WEBSOCKET');
	    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Max-Age");
	    res.header('Access-Control-Max-Age', '600');
	    next();
	});

}
