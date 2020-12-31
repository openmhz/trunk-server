import fs from "fs"
import express from "express"
import webpack from "webpack"
import path from "path"
import config from "../../webpack/webpack.config.dev.js"
import configureExpress from "./config/express"


// -------------------------------------------

const app = express()

// -------------------------------------------

const isDev = process.env.NODE_ENV === "development"

// if in development mode set up the middleware required for hot reloading and rebundling
if (isDev) {

	const compiler = webpack(config)

	app.use(require("webpack-dev-middleware")(compiler, {
		noInfo: true,
		publicPath: config.output.publicPath
	}))

	app.use(require("webpack-hot-middleware")(compiler))
}

var backend_server = process.env['BACKEND_SERVER'] != null ? process.env['BACKEND_SERVER'] : 'https://api.openmhz.com';
var frontend_server = process.env['FRONTEND_SERVER'] != null ? process.env['FRONTEND_SERVER'] : 'https://openmhz.com';
var media_server = process.env['MEDIA_SERVER'] != null ? process.env['MEDIA_SERVER'] : 'https://media.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var socket_server = process.env['SOCKET_SERVER'] != null ? process.env['SOCKET_SERVER'] : 'wss://api.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var site_name = process.env['SITE_NAME'] != null ? process.env['SITE_NAME'] : "OpenMHz";
const proPlanValue = process.env['PRO_PLAN'] != null ? process.env['PRO_PLAN'] : 10;
const freePlanValue = process.env['FREE_PLAN'] != null ? process.env['FREE_PLAN'] : 0;
const proPlanArchive = process.env['PRO_PLAN_ARCHIVE'] != null ? process.env['PRO_PLAN_ARCHIVE'] : 30;
const freePlanArchive = process.env['FREE_PLAN_ARCHIVE'] != null ? process.env['FREE_PLAN_ARCHIVE'] : 7;
// -------------------------------------------

// -------------------------------------------

configureExpress(app)

// -------------------------------------------
app.use(express.static("public"));
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
		<title>${site_name}</title>

    <meta name="viewport" content="width=device-width">
		<link
  rel="stylesheet"
  href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css"
/>
		<script>
			const backend_server = "${backend_server}";
			const media_server = "${media_server}";
			const socket_server = "${socket_server}";
			const proPlanValue = ${proPlanValue};
			const freePlanValue = ${freePlanValue};
			const proPlanArchive = ${proPlanArchive};
			const freePlanArchive = ${freePlanArchive};
			const site_name = "${site_name}";
		</script>
		<script src="${backend_server}/socket.io/socket.io.js"></script>
		<script>
		  const socket = io('${backend_server}');
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
