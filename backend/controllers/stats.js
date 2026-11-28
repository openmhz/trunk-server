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

    // callTotals is 0 for every system right after each 15-minute rollover, so
    // only a missing talkgroupStats means the system has no stats. Treating 0 as
    // missing made the public Activity view fail for a moment every 15 minutes.
    if (talkgroupStats !== undefined) {
        res.contentType('json');
        res.send(JSON.stringify({
            callTotals: callTotals || 0,
            talkgroupStats: talkgroupStats
        }));
    } else {
        console.log("ShortName didn't exist for stats: " + util.inspect(req.params));
        res.status(500);
        res.send("ShortName didn't exist for stats");
    }
}


var statSched = schedule.scheduleJob('*/15 * * * *', function() {
    sysStats.shiftStats().catch(err => console.error("Stats - shiftStats failed: " + (err && err.stack || err)));
});

