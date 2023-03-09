var mongoose = require('mongoose');



var podcastSchema = mongoose.Schema({
  title: String,
  description: String,
  expireTime: Date,
  startTime: Date,
  endTime: Date,
  downloadUrl: String,
  systems: [String],
  numCalls: Number,
  eventUrl: String,
  len: Number
},
{
  timestamps: true
});


module.exports = mongoose.model('Podcast', podcastSchema);
