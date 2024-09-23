var mongoose = require('mongoose');
const talkgroupSchema = require('./talkgroupSchema');

module.exports = mongoose.model('Talkgroup', talkgroupSchema);
