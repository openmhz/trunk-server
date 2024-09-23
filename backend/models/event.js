var mongoose = require('mongoose');
const frozenCallSchema = require('./frozenCallSchema');


var eventSchema = mongoose.Schema({
  title: String,
  description: String,
  expireTime: Date,
  startTime: Date,
  endTime: Date,
  downloadUrl: String,
  podcastUrl: String,
  shortNames: [String],
  calls: [frozenCallSchema],
  numCalls: Number
},
{
  timestamps: true
});

// add virtual if You want
eventSchema.virtual('callCount').get(function () {
  return this.calls.length;
});
module.exports = mongoose.model('Event', eventSchema);
