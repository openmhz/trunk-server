var mongoose = require('mongoose');
var Call = require('./call.js')

var starSchema = mongoose.Schema({
  talkgroupNum: Number,
  shortName: String,
  callId:  {type: mongoose.Schema.Types.ObjectId, ref: 'Call'},
  time: Date,
  star: {
		type: Number,
		default: 0
	}
});


module.exports = mongoose.model('Star', starSchema);
