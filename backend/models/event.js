var mongoose = require('mongoose');
var {callSchema} = require('./call');
console.log(callSchema)

var eventSchema = mongoose.Schema({
  title: String,
  description: String,
  expireTime: Date,
  startTime: Date,
  endTime: Date,
  shortNames: [String],
  calls: [callSchema],
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
