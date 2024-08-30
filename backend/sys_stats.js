var util = require("util");
const SystemStat = require("./models/system_stat");
var System = require("./models/system");
var talkgroupStats = {};
var callTotals = {};
var uploadErrors = {};
let decodeErrorsFreq = {};
const timePeriod = 15; // in minutes
var spots = (24 * 60) / timePeriod; // the number of spots needed to keep track of 24 hours of stats


async function updateActiveSystems() {
    // Go through all of the Systems
    let siteTotal = 0;
    for await (let item of System.find()) {
        // go through all the systems
        // if you have received some calls during that last period, make the system active
        if ((callTotals[item.shortName] != undefined) && (callTotals[item.shortName] > 0)) {
            item.active = true;
            siteTotal += callTotals[item.shortName];
            item.callAvg = callTotals[item.shortName] / timePeriod;
            item.lastActive = new Date();
        } else {
            item.active = false;
            item.callAvg = 0;
        }
        callTotals[item.shortName] = 0;
        /*
        let fromDate = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000);
        if ((item.lastActive != null) && (item.lastActive > fromDate)) {
            item.active = true;
        } else {
            item.active = false;
        }*/
        await item.save();
    };
    console.log("Site average uploads per minute: " + siteTotal / timePeriod);
}

exports.initStats = async function () {
    // get the System Stats collection
/*
    for await (const item of SystemStat.find()) {
        const obj = item.toObject();
        // Talkgroup Stats
        if (obj.talkgroupStats !== undefined) {
            talkgroupStats[obj.shortName] = Object.fromEntries(obj.talkgroupStats);
        }

        // Decode Errors
        if (obj.decodeErrorsFreq !== undefined) {

            decodeErrorsFreq[obj.shortName] = Object.fromEntries(obj.decodeErrorsFreq);
        }

        // Upload Error Totals
        if (obj.uploadErrors !== undefined) {
            uploadErrors[obj.shortName] = obj.uploadErrors;
        }

        if (obj.callTotals !== undefined) {
            callTotals[obj.shortName] = obj.callTotals;
        }
    };*/
}

// keeps track of the number of calls that get uploaded with an audio file
exports.addError = function (call) {
/*
    // if there is no Array associated with the system.
    if (uploadErrors[call.shortName] === undefined) {
        uploadErrors[call.shortName] = new Array();
        for (var j = 0; j < spots; j++) {
            uploadErrors[call.shortName][j] = 0;
        }
    }

    // Add an error to the count for the current period.
    uploadErrors[call.shortName][0]++;*/
}

// Keeps track of the number of calls for each talkgroup for a system
exports.addCall = function (call) {
    callTotals[call.shortName]++;
    /*
        // if you haven't started keeping track of stats for the System yet
        if (talkgroupStats[call.shortName] === undefined) {
            talkgroupStats[call.shortName] = {};
        }
        var sysTalkgroupStats = talkgroupStats[call.shortName];
        // if you haven't started keeping track of Stats for this TG yet... 
        if (sysTalkgroupStats[call.talkgroupNum] === undefined) {
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
        if (sysErrors[call.freq] === undefined) {
            sysErrors[call.freq] = {}
            sysErrors[call.freq].totalLen = 0;
            sysErrors[call.freq].errors = 0;
            sysErrors[call.freq].spikes = 0;
            sysErrors[call.freq].errorHistory = new Array();
            sysErrors[call.freq].spikeHistory = new Array();
            for (var j = 0; j < spots; j++) {
                sysErrors[call.freq].errorHistory[j] = 0;
                sysErrors[call.freq].spikeHistory[j] = 0;
            }
        }
        // add to the call count and total length, Call Average is calc by dividing the two...
        sysErrors[call.freq].totalLen += call.len;
        sysErrors[call.freq].errors += call.errorCount;
        sysErrors[call.freq].spikes += call.spikeCount;*/
}


// This gets called when a Time Period is up
exports.shiftStats = async function () {
/*
    console.log("Started Shifting Stats at: " + new Date());
    // for all the systems in Error Stats
    for (var shortName in uploadErrors) {
        if (uploadErrors.hasOwnProperty(shortName)) {

            // Update the DB with Error Stats and Error Totals
            const query = { shortName: shortName };
            const update = { $set: { "uploadErrors": uploadErrors[shortName] } };
            const options = { upsert: true };

            await SystemStat.updateOne(query, update, options);
            // move everything back one after updating
            for (var j = spots - 1; j > 0; j--) {
                uploadErrors[shortName][j] = uploadErrors[shortName][j - 1];
            }
            // reset the first spot back to 0, so you can count the next period
            uploadErrors[shortName][0] = 0;
        }
    }
    const bulkOps = [];
    console.log("Finished Shifting Upload Errors at: " + new Date());
    for (const [shortName, sysErrors] of Object.entries(decodeErrorsFreq)) {
        for (const [freqNum, freqErrors] of Object.entries(sysErrors)) {
            if (!freqErrors.errorHistory || !freqErrors.spikeHistory) {
                console.error(`[${shortName}] Skipping stat for freq: ${freqNum}`);
                continue;
            }

            freqErrors.errorHistory.unshift(freqErrors.totalLen > 0 ? freqErrors.errors / freqErrors.totalLen : 0);
            freqErrors.spikeHistory.unshift(freqErrors.totalLen > 0 ? freqErrors.spikes / freqErrors.totalLen : 0);

            freqErrors.errorHistory.pop();
            freqErrors.spikeHistory.pop();

            freqErrors.totalLen = freqErrors.errors = freqErrors.spikes = 0;
        }

        bulkOps.push({
            updateOne: {
                filter: { shortName },
                update: { $set: { decodeErrorsFreq: sysErrors } },
                upsert: true
            }
        });
    }




    console.log("Finished Shifting Decode Errors at: " + new Date());

    for (const [shortName, sysTalkgroupStats] of Object.entries(talkgroupStats)) {
        let callTotal = 0;

        for (const [talkgroupNum, tg] of Object.entries(sysTalkgroupStats)) {
            if (!tg.callCountHistory || !tg.callAvgLenHistory) {
                console.error(`[${shortName}] Skipping stat for tg: ${talkgroupNum}`);
                continue;
            }

            const tgHistoryTotal = tg.callCountHistory.reduce((sum, count) => sum + count, 0) + tg.calls;

            tg.callCountHistory.unshift(tg.calls);
            tg.callAvgLenHistory.unshift(tg.calls > 0 ? Math.floor(tg.totalLen / tg.calls) : 0);

            tg.callCountHistory.pop();
            tg.callAvgLenHistory.pop();

            callTotal += tg.calls;
            tg.calls = tg.totalLen = 0;

            if (tgHistoryTotal === 0) {
                delete sysTalkgroupStats[talkgroupNum];
            }
        }

        if (!callTotals[shortName]) {
            callTotals[shortName] = new Array(spots).fill(0);
        }

        callTotals[shortName].unshift(callTotal);
        callTotals[shortName].pop();

        bulkOps.push({
            updateOne: {
                filter: { shortName },
                update: { $set: { talkgroupStats: sysTalkgroupStats, callTotals: callTotals[shortName] } },
                upsert: true
            }
        });
    }
    console.log("Finished Shifting Talkgroup Stats at: " + new Date());
    if (bulkOps.length > 0) {
        await SystemStat.bulkWrite(bulkOps);
    }
    console.log("Finished writing to DB at: " + new Date());*/
    updateActiveSystems();
    console.log("Finished Updating Active Systems at: " + new Date());
}
exports.callTotals = function (shortName) {
    return callTotals[shortName];
}
exports.talkgroupStats = function (shortName) {
    return talkgroupStats[shortName];
}
exports.uploadErrors = function (shortName) {
    return uploadErrors[shortName];
}
exports.decodeErrorsFreq = function (shortName) {
    return decodeErrorsFreq[shortName];
}