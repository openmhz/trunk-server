// Schema shared with the other servers: packages/shared/models.js
const mongoose = require("mongoose");
const { userSchema, getModel } = require("@openmhz/shared");

module.exports = getModel(mongoose, "User", () => userSchema(mongoose));
