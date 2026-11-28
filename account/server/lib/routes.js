const { wrap } = require("@openmhz/shared");
const users = require("../controllers/users");

// All account routes, every handler wrapped so async errors reach errorHandler.
module.exports = function registerRoutes(app) {
	app.post("/login", wrap(users.login))
	app.get("/logout", wrap(users.logout))
	app.get("/authenticated", wrap(users.authenticated))
	app.post("/register", wrap(users.validateProfile), wrap(users.register))
	app.post("/users/:userId/reset-password/:token", wrap(users.resetPassword))
	app.post("/api/send-reset-password", wrap(users.sendResetPassword))
	app.post("/users/:userId", wrap(users.isLoggedIn), wrap(users.validateProfile), wrap(users.updateProfile))
	app.post("/users/:userId/terms", wrap(users.isLoggedIn), wrap(users.terms))
	app.post("/users/:userId/send-confirm", wrap(users.sendConfirmEmail))
	app.post("/users/:userId/confirm/:token", wrap(users.confirmEmail))
}
