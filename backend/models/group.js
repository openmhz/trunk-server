// Schema shared with the other servers: packages/shared/models.js
const mongoose = require("mongoose");
const { groupSchema, getModel } = require("@openmhz/shared");

module.exports = getModel(mongoose, "Group", () => groupSchema(mongoose));
