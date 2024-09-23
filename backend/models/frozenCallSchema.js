var mongoose = require('mongoose');
const callSchema = require('./callSchema');

var frozenCallSchema = mongoose.Schema();

frozenCallSchema.add(callSchema).add({
  systemName: String,
  systemDescription: String,
  talkgroupDescription: String,
  talkgroupAlpha: String,

});

module.exports = frozenCallSchema; 