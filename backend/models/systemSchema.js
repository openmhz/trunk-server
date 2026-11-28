// Schema shared with the other servers: packages/shared/models.js. Exported as a
// schema because uploads.js registers it on its own connection as well.
const mongoose = require("mongoose");
const { systemSchema } = require("@openmhz/shared");

module.exports = systemSchema(mongoose);
