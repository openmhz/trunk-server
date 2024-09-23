var mongoose = require('mongoose');
const callSchema = require('./callSchema');
/*
{ "_id" : ObjectId("5bbc148de26adf00068a0076"), "shortName" : "dcfd", "talkgroupNum" : 11619, "objectKey" : "dcfd-11619-1539052672.m4a", "endpoint" : "nyc3.digitaloceanspaces.com", "bucket" : "openmhz", "time" : ISODate("2018-10-09T02:37:52Z"), "name" : "11619-1539052672.m4a", "freq" : 856987500, "url" : "https://media.openmhz.com/dcfd/2018/10/9/11619-1539052672.m4a", "emergency" : 0, "path" : "/dcfd/2018/10/9/", "srcList" : [ { "pos" : 0, "src" : 1116743 }, { "pos" : 1.8, "src" : 1102467 }, { "pos" : 3.6, "src" : 1116743 } ], "freqList" : [ { "pos" : 0, "freq" : 856987500, "len" : 51744, "errors" : 170, "spikes" : 29 } ], "len" : 6.142 }
*/







module.exports = mongoose.model('Call', callSchema);
