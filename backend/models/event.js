var mongoose = require('mongoose');
var {callSchema} = require('./call');
console.log(callSchema)

var groupSchema = mongoose.Schema({
  title: String,
  description: String,
  expireTime: Number,
  startTime: Number,
  endTime: Number,
  shortNames: [String],
  calls: [callSchema]
},
{
  timestamps: true
});


module.exports = mongoose.model('Event', groupSchema);
