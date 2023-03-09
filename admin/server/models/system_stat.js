var mongoose = require('mongoose');

var systemStatSchema = mongoose.Schema({
  callTotals: [Number],
  errorTotals: [Number],
  usageBytes: Number,
  usageMb: Number,
  shortName: String
}, { collection: 'system_stats' });


module.exports = mongoose.model('SystemStat', systemStatSchema);
