var mongoose = require('mongoose');

var groupSchema = mongoose.Schema({
  shortName: String,
  groupName: String,
  groupId: String,
  position: Number,
  talkgroups: [Number]
});


module.exports = mongoose.model('Group', groupSchema);
