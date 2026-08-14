var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
var sessionMiddleware = require("./session");

var backend_server = process.env['REACT_APP_BACKEND_SERVER'] != null ? process.env['REACT_APP_BACKEND_SERVER'] : 'https://api.hamrecorder.com';
var frontend_server = process.env['REACT_APP_FRONTEND_SERVER'] != null ? process.env['REACT_APP_FRONTEND_SERVER'] : 'https://hamrecorder.com';
var admin_server = process.env['REACT_APP_ADMIN_SERVER'] != null ? process.env['REACT_APP_ADMIN_SERVER'] : 'https://admin.hamrecorder.com'; //'https://s3.amazonaws.com/robotastic';
var dev_server = frontend_server + ":3000"

// Additional browser origins allowed to make credentialed requests, comma
// separated. Needed for anything that reaches the site by an address the
// DOMAIN_NAME-derived values do not cover - a LAN IP during local development,
// for instance. It cannot be a wildcard: browsers reject "*" on credentialed
// requests, and the session cookie makes every player request credentialed.
var extra_origins = (process.env['EXTRA_CORS_ORIGINS'] || '')
	.split(',')
	.map(function (o) { return o.trim(); })
	.filter(function (o) { return o.length > 0; });


module.exports = function(app) {
	app.set("port", 3005)

	// X-Powered-By header has no functional value.
	// Keeping it makes it easier for an attacker to build the site's profile
	// It can be removed safely
	app.disable("x-powered-by")
	app.enable('trust proxy')
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(express.static(path.join(process.cwd(), 'public')));

	// Reads the session issued by the account service. saveUninitialized is off,
	// so anonymous traffic - including uploads - creates no session documents.
	app.use(sessionMiddleware)

	var node_env = process.env.NODE_ENV;
	console.log('--------------------------');
	console.log('===> 😊  Starting Server . . .');
	console.log('===>  Environment: ' + node_env);
	if(node_env === 'production') {
		console.log('===> 🚦  Note: In order for authentication to work in production');
		console.log('===>           you will need a secure HTTPS connection');
	}

	// The session cookie only reaches us on credentialed requests, and browsers
	// refuse a credentialed request whose Access-Control-Allow-Origin is "*".
	// This used to answer "*" for anything unrecognised, which silently made the
	// cookie undeliverable - so the origin is now echoed back or simply omitted.
	app.use('/*', function(req, res, next) {
	    var allowedOrigins = [ admin_server];
	    allowedOrigins.push(frontend_server);
	    allowedOrigins.push(backend_server);
		allowedOrigins.push(dev_server);
		allowedOrigins.push("https://www.hamrecorder.com");
		extra_origins.forEach(function (o) { allowedOrigins.push(o); });

	    var origin = req.headers.origin;

	    if (allowedOrigins.indexOf(origin) > -1) {
	        res.setHeader('Access-Control-Allow-Origin', origin);
	        res.setHeader('Vary', 'Origin');
	        res.header('Access-Control-Allow-Credentials', 'true');
	    } else if (origin) {
	        // Unknown browser origin: no CORS headers at all, so the browser
	        // blocks it. Omitting is the correct answer here - answering "*"
	        // would not help a credentialed request anyway.
	        console.warn("blocked CORS for: " + origin + " referer: " + req.headers.referer + " url: " + req.originalUrl);
	    }
	    // Requests with no Origin header - trunk-recorder uploads, curl, server
	    // to server - are not subject to CORS and need no headers.

	    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
		res.header("Access-Control-Allow-Headers", "Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
	    res.header('Access-Control-Max-Age', '600');

	    // Preflights need to end here. Credentialed cross-origin requests trigger
	    // them, and previously they fell through to a 404.
	    if (req.method === 'OPTIONS') {
	        return res.sendStatus(204);
	    }
	    next();
	});

}
