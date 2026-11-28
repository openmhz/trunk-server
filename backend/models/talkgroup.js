const mongoose = require("mongoose");
const { getModel } = require("@openmhz/shared");
const talkgroupSchema = require("./talkgroupSchema");

module.exports = getModel(mongoose, "Talkgroup", () => talkgroupSchema);
