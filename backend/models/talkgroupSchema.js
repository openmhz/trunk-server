var mongoose = require('mongoose');

const talkgroupSchema = mongoose.Schema({
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

module.exports = talkgroupSchema;