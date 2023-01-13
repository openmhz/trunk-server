var mongoose = require('mongoose');

var talkgroupSchema = mongoose.Schema({
  shortName: String,
  userId: String,
  num: Number,
  mode: String,
  alpha: String,
  description: String,
  tag: String,
  group: String,
  priority: Number
});


module.exports = mongoose.model('Talkgroup', talkgroupSchema);
