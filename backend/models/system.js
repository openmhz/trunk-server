const mongoose = require("mongoose");
const { getModel } = require("@openmhz/shared");
const systemSchema = require("./systemSchema");

module.exports = getModel(mongoose, "System", () => systemSchema);
