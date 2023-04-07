var util = require("util");
var db = require('./db');
var talkgroupStats = {};
var callTotals = {};
var uploadErrors = {};
let decodeErrorsFreq = {};
const timePeriod = 15; // in minutes
var spots = (24*60) / timePeriod; // the number of spots needed to keep track of 24 hours of stats


function updateActiveSystems() {

    // Go through all of the Systems
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

    db.get().collection("system_stats").exists(function(err, result) {
        if (result) {




    db.get().collection('system_stats', function(err, statsCollection) {
        var cursor = statsCollection.find();

        // go through each of the Systems in Stats
        cursor.each(function(err, item) {
            
            // If you are not at the end...
            if (item) {
                //console.log("Loading stats for: " + item.shortName);
                
                // Talkgroup Stats
                if (item.talkgroupStats != undefined) {
                    talkgroupStats[item.shortName] = item.talkgroupStats;
                }

                // Decode Errors
                if (item.decodeErrorsFreq != undefined) {
                    decodeErrorsFreq[item.shortName] = item.decodeErrorsFreq;
                }

                // Upload Error Totals
                if (item.uploadErrors != undefined) {
                    uploadErrors[item.shortName] = item.uploadErrors;
                }

                if (item.callTotals != undefined) {
                    callTotals[item.shortName] = item.callTotals;
                }
            } else {

            }
        });
    });
    } else {
        db.get().createCollection("system_stats", function(err, res) {
        if (err) {
            console.log("Error creating system_stats collection");
            console.log(err);
        } else {
            console.log('system_stats created!');
        }
        });
    }
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
    if (talkgroupStats[call.shortName] == undefined) {
        talkgroupStats[call.shortName] = {};
    }
    var sysTalkgroupStats = talkgroupStats[call.shortName];
    // if you haven't started keeping track of Stats for this TG yet... 
    if (sysTalkgroupStats[call.talkgroupNum] == undefined) {
        sysTalkgroupStats[call.talkgroupNum] = {}
        sysTalkgroupStats[call.talkgroupNum].calls = 0;
        sysTalkgroupStats[call.talkgroupNum].totalLen = 0;
        sysTalkgroupStats[call.talkgroupNum].callCountHistory = new Array();
        sysTalkgroupStats[call.talkgroupNum].callAvgLenHistory = new Array();
        for (var j = 0; j < spots; j++) {
            sysTalkgroupStats[call.talkgroupNum].callCountHistory[j] = 0;
            sysTalkgroupStats[call.talkgroupNum].callAvgLenHistory[j] = 0;
        }
    }

    // add to the call count and total length, Call Average is calc by dividing the two...
    sysTalkgroupStats[call.talkgroupNum].calls++;
    sysTalkgroupStats[call.talkgroupNum].totalLen += call.len;

    // if you haven't started keeping track of stats for the System yet
    if (decodeErrorsFreq[call.shortName] == undefined) {
        decodeErrorsFreq[call.shortName] = {};
    }

    var sysErrors = decodeErrorsFreq[call.shortName];

    // if you haven't started keeping track of Stats for this TG yet... 
    if (sysErrors[call.freq] == undefined) {
        sysErrors[call.freq] = {}
        sysErrors[call.freq].totalLen = 0;
        sysErrors[call.freq].errors = 0;
        sysErrors[call.freq].spikes = 0;
        sysErrors[call.freq].errorHistory = new Array();
        sysErrors[call.freq].spikeHistory = new Array();
        for (var j = 0; j < spots; j++) {
            sysErrors[call.freq].errors[j] = 0;
            sysErrors[call.freq].spikes [j] = 0;
        }
    }
    // add to the call count and total length, Call Average is calc by dividing the two...
    sysErrors[call.freq].totalLen += call.len;
    sysErrors[call.freq].errors += call.errorCount;
    sysErrors[call.freq].spikes += call.spikeCount;
}


// This gets called when a Time Period is up
exports.shiftStats = function() {
    db.get().collection('system_stats', function(err, statsCollection) {

        // for all the systems in Error Stats
        for (var shortName in uploadErrors) {
            if (upload.hasOwnProperty(shortName)) {

                // Update the DB with Error Stats and Error Totals
                statsCollection.update({
                    shortName: shortName
                }, {
                    $set: {
                        "uploadErrors": uploadErrors[shortName]
                    }
                }, {
                    upsert: true
                }, function(err, objects) {
                    if (err) {
                      console.log("Shortname: " + shortName);
                      console.log("uploadErrors: " + util.inspect(uploadErrors[shortName]));
                      console.warn(err.message);
                    }
                });

                // move everything back one after updating
                for (var j = spots - 1; j > 0; j--) {
                    uploadErrors[shortName][j] = uploadErrors[shortName][j - 1];
                }
                // reset the first spot back to 0, so you can count the next period
                uploadErrors[shortName][0] = 0;
            }
        }

 
        // for each system in decodeErrorsFreq
        for (let shortName in decodeErrorsFreq) {

            // if the system is in decodeErrorsFreq
            if (decodeErrorsFreq.hasOwnProperty(shortName)) {
                var sysErrors = decodeErrorsFreq[shortName];

                // for each freq in that systems stats
                for (var freqNum in sysErrors ) {
                    if (sysErrors.hasOwnProperty(freqNum)) {
                        var freqErrors = sysErrors[freqNum];

                        // move the history for that freq back
                        for (let j = spots - 1; j > 0; j--) {
                            let i = j - 1;
                            freqErrors.errorHistory[j] = freqErrors.errorHistory[i];
                            freqErrors.spikeHistory[j] = freqErrors.spikeHistory[i];
                        }

                          if (freqErrors.totalLen > 0) {
                            freqErrors.errorHistory[0] = (freqErrors.errors / freqErrors.totalLen);
                            freqErrors.spikeHistory[0] = (freqErrors.spikes / freqErrors.totalLen);
                          } else {
                            freqErrors.errorHistory[0] = 0;
                            freqErrors.spikeHistory[0] = 0;
                          }
                          freqErrors.totalLen = 0;
                          freqErrors.errors = 0;
                          freqErrors.spikes = 0;
                    }
                }

                statsCollection.update({
                    shortName: shortName
                }, {
                    $set: {
                        "decodeErrorsFreq": decodeErrorsFreq[shortName],
                    }
                }, {
                    upsert: true
                }, function(err, objects) {
                    if (err){
                      console.log("Shortname: " + shortName);
                      console.log("decodeErrorsFreq: " + util.inspect(decodeErrorsFreq[shortName]));
                    console.warn(err.message);
                  }
                });

            }
        }
    


        // for each system in talkgroupStats
        for (let shortName in talkgroupStats) {
            let callTotal = 0;

            // if the system is in stats
            if (talkgroupStats.hasOwnProperty(shortName)) {
                var sysTalkgroupStats = talkgroupStats[shortName];

                // for each talkgroup in that systems stats
                for (var talkgroupNum in sysTalkgroupStats ) {
                    if (sysTalkgroupStats.hasOwnProperty(talkgroupNum)) {
                        var tg = sysTalkgroupStats[talkgroupNum];
                        var tgHistoryTotal = 0;
                        // move the history for that talkgroup back
                        for (let j = spots - 1; j > 0; j--) {
                            let i = j - 1;
                            tgHistoryTotal += tg.callCountHistory[i];
                            tg.callCountHistory[j] = tg.callCountHistory[i];
                            tg.callAvgLenHistory[j] = tg.callAvgLenHistory[i];
                        }

                        // add to the total for that group
                        callTotal += tg.calls;


                          // figure out the history for current period in the history for this talkgroup;
                          tg.callCountHistory[0] = tg.calls;
                          tgHistoryTotal += tg.calls;
                          if (tg.calls > 0) {
                              tg.callAvgLenHistory[0] = Math.floor(tg.totalLen / tg.calls);
                          } else {
                              tg.callAvgLenHistory[0] = 0;
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
                        "talkgroupStats": talkgroupStats[shortName],
                        "callTotals": callTotals[shortName]
                    }
                }, {
                    upsert: true
                }, function(err, objects) {
                    if (err){
                      console.log("Shortname: " + shortName);
                      console.log("TgStats: " + util.inspect(talkgroupStats[shortName]));
                      console.log("Call Totals: " + util.inspect(callTotals[shortName]));
                    console.warn(err.message);
                  }
                });

            }
        }
    });
    updateActiveSystems();
}
exports.callTotals = function(shortName) {
    return callTotals[shortName];
}
exports.talkgroupStats = function(shortName) {
    return talkgroupStats[shortName];
}
exports.uploadErrors = function(shortName) {
    return uploadErrors[shortName];
}
exports.decodeErrorsFreq = function(shortName) {
    return decodeErrorsFreq[shortName];
}