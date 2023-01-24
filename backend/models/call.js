var mongoose = require('mongoose');
/*
{ "_id" : ObjectId("5bbc148de26adf00068a0076"), "shortName" : "dcfd", "talkgroupNum" : 11619, "objectKey" : "dcfd-11619-1539052672.m4a", "endpoint" : "nyc3.digitaloceanspaces.com", "bucket" : "openmhz", "time" : ISODate("2018-10-09T02:37:52Z"), "name" : "11619-1539052672.m4a", "freq" : 856987500, "url" : "https://media.openmhz.com/dcfd/2018/10/9/11619-1539052672.m4a", "emergency" : 0, "path" : "/dcfd/2018/10/9/", "srcList" : [ { "pos" : 0, "src" : 1116743 }, { "pos" : 1.8, "src" : 1102467 }, { "pos" : 3.6, "src" : 1116743 } ], "freqList" : [ { "pos" : 0, "freq" : 856987500, "len" : 51744, "errors" : 170, "spikes" : 29 } ], "len" : 6.142 }
*/
var srcSchema = mongoose.Schema({ pos: Number, src: String });
var freqSchema = mongoose.Schema({ pos: Number, freq: Number, len: Number, error: Number, spikes: Number});
var callSchema = mongoose.Schema({
  talkgroupNum: Number,
  shortName: String,
  objectKey: String,
  endpoint: String,
  bucket: String,
  time: Date,
  name: String,
  freq: Number,
  url: String,
  emergency: Boolean,
  path: String,
  len: Number,
  star: {
		type: Number,
		default: 0
	},
  srcList: [srcSchema],
  freqList: [freqSchema]
});


exports.callSchema = callSchema;
exports.callModel = mongoose.model('Call', callSchema);
