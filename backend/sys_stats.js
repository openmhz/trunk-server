var util = require("util");
var db = require('./db');
var stats = {};
var callTotals = {};
var errorTotals = {};
const timePeriod = 15; // in minutes
var spots = (24*60) / timePeriod; // the number of spots needed to keep track of 24 hours of stats


function updateActiveSystems() {

    // Go through all of the Syste,s
    db.get().collection('systems', function(err, sysCollection) {
        var cursor = sysCollection.find();
        cursor.each(function(err, item) {
            // go through all the systems

            // While there are still Systems to work with
            if (item) {
                // if you have recieved some calls during that last period, make the system active
                if ((callTotals[item.shortName] != undefined) && (callTotals[item.shortName][0] > 0)) {
                    const active = true;
                    const callAvg = callTotals[item.shortName][0] / timePeriod;
                    sysCollection.update({
                        shortName: item.shortName
                    }, {
                        $set: {
                            "active": active,
                            "callAvg": callAvg,
                            "lastActive": new Date()
                        }
                    }, {
                        upsert: true
                    }, function(err, objects) {
                        if (err) {
                          console.log("Shortname: " + item.shortName);
                          console.warn(err.message);
                        }
                    });
                } else {
                    sysCollection.update({
                        shortName: item.shortName
                    }, {
                        $set: {
                            "active": false,
                            "callAvg": 0
                        }
                    }, {
                        upsert: true
                    }, function(err, objects) {
                        if (err) {
                          console.log("Shortname: " + item.shortName);
                          console.warn(err.message);
                        }
                    });
                }
            } 
        });
    });
}

exports.initStats = function() {
    // get the System Stats collection
    db.get().collection('system_stats', function(err, statsCollection) {
        var cursor = statsCollection.find();

        // go through each of the Systems in Stats
        cursor.each(function(err, item) {
            
            // If you are not at the end...
            if (item) {
                //console.log("Loading stats for: " + item.shortName);
                
                // Talkgroup Stats
                if (item.talkgroupStats != undefined) {
                    stats[item.shortName] = item.talkgroupStats;
                }

                // Error Totals
                if (item.errorTotals != undefined) {
                    errorTotals[item.shortName] = item.errorTotals;
                }

                if (item.callTotals != undefined) {
                    callTotals[item.shortName] = item.callTotals;
                }
            } else {

            }
        });
    });
}

// keeps track of the number of calls that get uploaded with an audio file
exports.addError = function(call) {

    // if there is no Array associated with the system.
    if (errorTotals[call.shortName] == undefined) {
        errorTotals[call.shortName] = new Array();
        for (var j = 0; j < spots; j++) {
            errorTotals[call.shortName][j] = 0;
        }
    }

    // Add an error to the count for the current period.
    errorTotals[call.shortName][0]++;
}

// Keeps track of the number of calls for each talkgroup for a system
exports.addCall = function(call) {

    // if you haven't started keeping track of stats for the System yet
    if (stats[call.shortName] == undefined) {
        stats[call.shortName] = {};

    }

    var stat = stats[call.shortName];

    // if you haven't started keeping track of Stats for this TG yet... 
    if (stat[call.talkgroupNum] == undefined) {
        stat[call.talkgroupNum] = {}
        stat[call.talkgroupNum].calls = 0;
        stat[call.talkgroupNum].totalLen = 0;
        stat[call.talkgroupNum].callCount = new Array();
        stat[call.talkgroupNum].avgLen = new Array();
        for (var j = 0; j < spots; j++) {
            stat[call.talkgroupNum].callCount[j] = 0;
            stat[call.talkgroupNum].avgLen[j] = 0;
        }
    }

    // add to the call count and total length, Call Average is calc by dividing the two...
    stat[call.talkgroupNum].calls++;
    stat[call.talkgroupNum].totalLen += call.len;
}


// This gets called when a Time Period is up
exports.shiftStats = function() {
    db.get().collection('system_stats', function(err, statsCollection) {

        // for all the systems in Error Stats
        for (var shortName in errorTotals) {
            if (stats.hasOwnProperty(shortName)) {

                // Update the DB with Error Stats and Error Totals
                statsCollection.update({
                    shortName: shortName
                }, {
                    $set: {
                        "errorTotals": errorTotals[shortName]
                    }
                }, {
                    upsert: true
                }, function(err, objects) {
                    if (err) {
                      console.log("Shortname: " + shortName);
                      console.log("errorTotals: " + util.inspect(errorTotals[shortName]));
                      console.warn(err.message);
                    }
                });

                // move everything back one after updating
                for (var j = spots - 1; j > 0; j--) {
                    errorTotals[shortName][j] = errorTotals[shortName][j - 1];
                }
                // reset the first spot back to 0, so you can count the next period
                errorTotals[shortName][0] = 0;
            }
        }

        // figure out the stats

        // for each system in stats
        for (var shortName in stats) {
            var callTotal = 0;

            // if the system is in stats
            if (stats.hasOwnProperty(shortName)) {
                var stat = stats[shortName];

                // for each talkgroup in that systems stats
                for (var talkgroupNum in stat) {
                    if (stat.hasOwnProperty(talkgroupNum)) {
                        var tg = stat[talkgroupNum];
                        var tgHistoryTotal = 0;
                        // move the history for that talkgroup back
                        for (var j = spots - 1; j > 0; j--) {
                            var i = j - 1;
                            tgHistoryTotal += tg.callCount[i];
                            tg.callCount[j] = tg.callCount[i];
                            tg.avgLen[j] = tg.avgLen[i];
                        }

                        // add to the total for that group
                        callTotal += tg.calls;


                          // figure out the history for cell 0;
                          tg.callCount[0] = tg.calls;
                          tgHistoryTotal += tg.calls;
                          if (tg.calls > 0) {
                              tg.avgLen[0] = Math.floor(tg.totalLen / tg.calls);
                          } else {
                              tg.avgLen[0] = 0;
                          }
                          tg.calls = 0;
                          tg.totalLen = 0;
                          if (tgHistoryTotal ==0 ) {
                            // there has been no recent activity on this talkgroup. remove it from the stats.
                            delete stat[talkgroupNum];
                          }
                    }
                }

                // figure out call totals for this shortName/Sys
                if (callTotals[shortName] == undefined) {
                    callTotals[shortName] = new Array();
                    for (var j = 0; j < spots; j++) {
                        callTotals[shortName][j] = 0;
                    }
                }


                for (var j = spots - 1; j > 0; j--) {
                    callTotals[shortName][j] = callTotals[shortName][j - 1];
                }
                callTotals[shortName][0] = callTotal;

                statsCollection.update({
                    shortName: shortName
                }, {
                    $set: {
                        "talkgroupStats": stats[shortName],
                        "callTotals": callTotals[shortName]
                    }
                }, {
                    upsert: true
                }, function(err, objects) {
                    if (err){
                      console.log("Shortname: " + shortName);
                      console.log("TgStats: " + util.inspect(stats[shortName]));
                      console.log("Call Totals: " + util.inspect(callTotals[shortName]));
                    console.warn(err.message);
                  }
                });

            }
        }
    });
    updateActiveSystems();
}
exports.callHistory = function(shortName) {
    return callTotals[shortName];
}
exports.tgHistory = function(shortName) {
    return stats[shortName];
}

exports.errorTotals = function(shortName) {
    return errorTotals[shortName];
}
