// Assembles configuration from the environment. Nothing secret is stored in
// this file, so it is safe to commit.
var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;
var mongoUrl = 'mongodb://' + host + ':' + port + '/scanner';



// No sessionSecret here: the frontend server runs no session middleware. The
// value that used to sit in this slot was the upstream default and was never read.
const secrets = {
	db: mongoUrl
}

module.exports = secrets
