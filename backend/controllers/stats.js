
var db = require('../db');
var schedule = require('node-schedule');
var sysStats = require("../sys_stats");
const util = require('util');

exports.init_stats = function() {
sysStats.initStats();
}

exports.get_errors = function(req, res) {
    var short_name = req.params.shortName.toLowerCase();

    var start = new Date();
    start.setHours(start.getHours() - 1);
    var collection = db.get().collection("calls");
    collection.aggregate([{
            $match: {
                time: {
                    $gte: start
                },
                shortName: short_name
            }
        },

        {
            "$unwind": "$freqList"
        },
        {
            "$project": {
                "freqList": 1,
                "errorRatio": {
                    $cond: [{
                        $eq: ["$freqList.len", 0]
                    }, 0, {
                        "$multiply": [{
                            "$divide": ["$freqList.error", "$freqList.len"]
                        }, 100]
                    }]
                },
                "time": "$time"
            }
        },
        {
            "$group": {
                "_id": "$freqList.freq",
                "values": {
                    "$push": {
                        "time": "$time",
                        "errors": "$errorRatio",
                        "spikes": "$freqList.spikes"
                    }
                }
            }
        },
        {
            $sort: {
                _id: -1
            }
        }
    ], function(err, results) {
        if (err) {
            console.warn("Error with error stats: " + util.inspect(req.params) + " err: " + err);
            res.status(500);
            res.send("Error with error stats: " + util.inspect(req.params) + " err: " + err);
        } else {
            res.contentType('json');
            res.send(JSON.stringify(results));
        }
    });
}

exports.get_stats = function(req, res) {
    var short_name = req.params.shortName.toLowerCase();

    var callHistory = sysStats.callHistory(short_name);
    var tgHistory = sysStats.tgHistory(short_name);
    var errorTotals = sysStats.errorTotals(short_name);
    if (callHistory && tgHistory) {
        res.contentType('json');
        res.send(JSON.stringify({
            callHistory: callHistory,
            tgHistory: tgHistory,
            errorTotals: errorTotals
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
