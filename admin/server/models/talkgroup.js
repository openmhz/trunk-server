// Schema shared with the other servers: packages/shared/models.js
const mongoose = require("mongoose");
const { talkgroupSchema, getModel } = require("@openmhz/shared");

module.exports = getModel(mongoose, "Talkgroup", () => talkgroupSchema(mongoose));
