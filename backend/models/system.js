var mongoose = require('mongoose');
const systemSchema = require('./systemSchema');


exports.systemSchema = systemSchema;
module.exports = mongoose.model('System', systemSchema);
