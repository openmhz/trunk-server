// Mongo URL and session secret, from the environment (see packages/shared/mongo.js).
const { mongoUrl, sessionSecret } = require("@openmhz/shared");

module.exports = {
  db: mongoUrl(),
  sessionSecret: sessionSecret(),
};
