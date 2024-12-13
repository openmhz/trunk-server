var mongoose = require('mongoose');

var srcSchema = mongoose.Schema({ pos: Number, src: String });

const callSchema = mongoose.Schema({
  talkgroupNum: Number,
  shortName: String,
  objectKey: String,
  endpoint: String,
  bucket: String,
  time: Date,
  name: String,
  freq: Number,
  errorCount: Number,
  spikeCount: Number,
  url: String,
  emergency: Boolean,
  path: String,
  len: Number,
  patches: [Number],
  star: {
		type: Number,
		default: 0
	},
  srcList: [srcSchema]
});

module.exports = callSchema;