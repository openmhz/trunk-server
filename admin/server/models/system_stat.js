var mongoose = require('mongoose');



let decodeErrorSchema = mongoose.Schema({
  errorHistory: [Number],
  spikeHistory: [Number],
})

let talkgroupStatsSchema = mongoose.Schema({
  callCountHistory: [Number],
  callAvgLenHistory: [Number]
})
var systemStatSchema = mongoose.Schema({
  callTotals: [Number],
  uploadErrors: [Number],
  decodeErrorsFreq: {
    type: Map,
    of: decodeErrorSchema
  },
  talkgroupStats: {
    type: Map,
    of: talkgroupStatsSchema
  },
  shortName: String
}, { collection: 'system_stats' });


module.exports = mongoose.model('SystemStat', systemStatSchema);
