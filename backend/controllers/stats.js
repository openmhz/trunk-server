var schedule = require('node-schedule');
var sysStats = require("../sys_stats");
const util = require('util');

exports.init_stats = function() {
sysStats.initStats();
}

exports.get_stats = function(req, res) {
    var short_name = req.params.shortName.toLowerCase();

    var callTotals = sysStats.callTotals(short_name);
    var talkgroupStats = sysStats.talkgroupStats(short_name);
    var uploadErrors = sysStats.uploadErrors(short_name);
    let decodeErrorsFreq = sysStats.decodeErrorsFreq(short_name);

    if (callTotals && talkgroupStats) {
        res.contentType('json');
        res.send(JSON.stringify({
            callTotals: callTotals,
            talkgroupStats: talkgroupStats,
            uploadErrors: uploadErrors,
            decodeErrorsFreq: decodeErrorsFreq
        }));
    } else {
        console.log("ShortName didn't exist for stats: " + util.inspect(req.params));
        res.status(500);
        res.send("ShortName didn't exist for stats");
    }
}


var statSched = schedule.scheduleJob('*/15 * * * *', function() {
    sysStats.shiftStats();
});
