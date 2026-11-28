// Schema shared with the other servers: packages/shared/models.js
const mongoose = require("mongoose");
const { systemSchema, getModel } = require("@openmhz/shared");

module.exports = getModel(mongoose, "System", () => systemSchema(mongoose));
