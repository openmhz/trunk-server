import fs from "fs"
import express from "express"
import mongoose from "mongoose"
import passport from "passport"
import webpack from "webpack"
import path from "path"
import config from "../../webpack/webpack.config.dev.js"
import secrets from "./config/secrets"
import configurePassport from "./config/passport"
import configureExpress from "./config/express"
import users from "./controllers/users"
import plans from "./controllers/plans"
const stripeKeyPublishable = process.env.STRIPE_PUBLISHABLE_KEY;
const stripeKeySecret = process.env.STRIPE_SECRET_KEY;

const stripe = require("stripe")(stripeKeySecret);
import "./models/user"

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


var backend_server = process.env['BACKEND_SERVER'] != null ? process.env['BACKEND_SERVER'] : 'https://api.openmhz.com';
var frontend_server = process.env['FRONTEND_SERVER'] != null ? process.env['FRONTEND_SERVER'] : 'https://openmhz.com';
var socket_server = process.env['SOCKET_SERVER'] != null ? process.env['SOCKET_SERVER'] : 'wss://api.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var admin_server = process.env['ADMIN_SERVER'] != null ? process.env['ADMIN_SERVER'] : 'https://admin.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var account_server = process.env['ACCOUNT_SERVER'] != null ? process.env['ACCOUNT_SERVER'] : 'https://account.openmhz.com'; //'https://s3.amazonaws.com/robotastic';
var site_name = process.env['SITE_NAME'] != null ? process.env['SITE_NAME'] : "OpenMHz";
const proPlanValue = process.env['PRO_PLAN'] != null ? process.env['PRO_PLAN'] : 10;
const freePlanValue = process.env['FREE_PLAN'] != null ? process.env['FREE_PLAN'] : 0;
const proPlanPrice = process.env['PRO_PLAN_PRICE'] != null ? process.env['PRO_PLAN_PRICE'] : 15;
const freePlanPrice = process.env['FREE_PLAN_PRICE'] != null ? process.env['FREE_PLAN_PRICE'] : 0;


// -------------------------------------------

configurePassport(app, passport)
configureExpress(app, passport)


app.all('*', function(req, res, next) {
  	var allowedOrigins = [account_server, admin_server, frontend_server];
		var origin = req.headers.origin;
    if(allowedOrigins.indexOf(origin) > -1){
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
app.post("/users/:userId/send-confirm",  users.sendConfirmEmail)
app.post("/users/:userId/confirm/:token",  users.confirmEmail)
/*app.get("/api/invoices", users.isLoggedIn, plans.getInvoices)
app.post("/api/plans", users.isLoggedIn, plans.updatePlans)
app.get("/api/billing", users.isLoggedIn, (req,res) => {
	if (req.user.customerId) {
		stripe.customers.retrieve(
			req.user.customerId,  
			function(err, customer) {
				if (err) {
					return res.json({
						success: false,
						message: err
					});					
				}
				if (customer) {
					if (customer.sources.total_count < 1) {
						return res.json({
							success: false,
							message: "Payment sources not defined"
						});
					}

					for (var i=0; i < customer.sources.data.length; i++) {
						

						var source = customer.sources.data[i];
						if (source.id == customer.default_source) {
							console.log("match on: " + i);
							var obj = {
								name: source.owner.name,
								brand: source.card.brand,
								country: source.card.country,
								exp_month: source.card.exp_month,
								exp_year: source.card.exp_year,
								last4: source.card.last4
							}
							return res.json({
								success: true,
								source: obj
							});
						}
					}
					
				}
				return res.json({
					success: false,
					message: "Default payment source not found"
				});
	
			}
		  );
	} else {
		return res.json({
			success: false,
			message: "User does not have a Customer ID"
		});
	}
});*/

function updateCustomerId(req, res, err, customer) {
	if (err){
		return res.json({
			success: false,
			message: err
		});
	}
	req.user.customerId = customer.id;
	req.user.save(err => {
		if (err) {
		  console.error("Error saving customer ID");
		  console.error(err);
		  res.json({
			success: false,
			message: err
		  });
		  return;
		}
	});
	console.log(customer);
	if (customer.sources.total_count < 1) {
		return res.json({
			success: false,
			message: "Payment sources not defined"
		});
	}

	for (var i=0; i < customer.sources.data.length; i++) {
		console.log("--------Customer-----------");	
		console.log(customer);

		var source = customer.sources.data[i];
		if (source.id == customer.default_source) {
			console.log("--------Source-----------");	
			console.log(source);
			var obj = {
				name: source.owner.name,
				brand: source.card.brand,
				country: source.card.country,
				exp_month: source.card.exp_month,
				exp_year: source.card.exp_year,
				last4: source.card.last4
			}
			return res.json({
				success: true,
				source: obj
			});
		}
	}
}


app.post("/api/customer", users.isLoggedIn, (req, res) => {

  //
	if (req.user.customerId) {
		stripe.customers.update(req.user.customerId, {
		  source: req.body.sourceId
		}, function(err, customer) {
			return updateCustomerId(req, res, err, customer);
		  });
	} else {
		stripe.customers.create({
			email: req.user.email,
		  source: req.body.sourceId
		}, function(err, customer) {
			return updateCustomerId(req, res, err, customer);
		  });
	}	
  });

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
		<title>OpenMHz - Account</title>
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<script src="https://js.stripe.com/v3/"></script>
		<link rel="stylesheet" type="text/css" href="/style/style.css"></link>
		<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.1/dist/semantic.min.css" />
		<script>
		const frontend_server = "${frontend_server}";
				const admin_server = "${admin_server}";
				const backend_server = "${backend_server}";
				const socket_server = "${socket_server}";
				const account_server = "${account_server}";
				const site_name = "${site_name}";
				const proPlanValue = ${proPlanValue};
				const freePlanValue = ${freePlanValue};
				const proPlanPrice = ${proPlanPrice};
				const freePlanPrice = ${freePlanPrice};				
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
