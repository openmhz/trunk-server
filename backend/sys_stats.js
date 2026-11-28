const System = require("./models/system");
const fs = require("fs");
const path = require("path");
var talkgroupStats = {};
var callTotals = {};
const timePeriod = 15; // in minutes
var spots = (24 * 60) / timePeriod; // the number of spots needed to keep track of 24 hours of stats
let uploadsPerMin = new Array(spots).fill(0);
let activeSystems = 0;
let totalClients = 0;

// Read at call time so tests can point it somewhere else.
function statsDir() {
    return process.env.STATS_DIR || "/data/stats";
}

function updateUploadsPerMin(totalUploads) {
    uploadsPerMin.push(totalUploads / timePeriod);
    uploadsPerMin.shift();
}

// Write to a temp file and rename it into place, so a crash mid-write can't
// leave a truncated file for the next startup. Never throws (full disk etc).
async function saveJson(name, data) {
    const filePath = path.join(statsDir(), name);
    const tmpPath = filePath + ".tmp";
    try {
        await fs.promises.writeFile(tmpPath, JSON.stringify(data));
        await fs.promises.rename(tmpPath, filePath);
    } catch (error) {
        console.error("Stats - Error saving " + filePath + ": " + (error && error.message || error));
    }
}

async function updateActiveSystems() {
    // Go through all of the Systems
    let siteTotal = 0;
    activeSystems = 0;

    try {
        const systems = await System.find({}, { shortName: 1 }).lean();
        const ops = [];
        const now = new Date();
        for (const item of systems) {
            // if you have received some calls during that last period, make the system active
            const total = callTotals[item.shortName];
            let set;
            if ((total != undefined) && (total > 0)) {
                siteTotal += total;
                activeSystems++;
                set = { active: true, callAvg: total / timePeriod, lastActive: now };
            } else {
                set = { active: false, callAvg: 0 };
            }
            callTotals[item.shortName] = 0;
            ops.push({ updateOne: { filter: { _id: item._id }, update: { $set: set } } });
        }
        if (ops.length) {
            await System.bulkWrite(ops, { ordered: false });
        }
    } catch (error) {
        console.error("Stats - Error updating active systems: " + (error && error.message || error));
    }
    updateUploadsPerMin(siteTotal);
    await saveJson("uploadsPerMin.json", uploadsPerMin);
}

function loadJson(name, label, apply) {
    const filePath = path.join(statsDir(), name);
    if (fs.existsSync(filePath)) {
        try {
            apply(JSON.parse(fs.readFileSync(filePath, "utf8")));
        } catch (error) {
            console.error(label + " - Error parsing JSON data:", error);
        }
    } else {
        console.error(label + " File not found: " + filePath);
    }
}

exports.initStats = async function () {
    loadJson("talkgroups.json", "Talkgroup Stats", (data) => { talkgroupStats = data; });
    // (an old decodeErrorsFreq.json may still be in the stats dir; it is no longer used and can be deleted)
    loadJson("uploadsPerMin.json", "Uploads Per Min", (data) => { uploadsPerMin = data; });
}

// Keeps track of the number of calls for each talkgroup for a system
exports.addCall = function (call) {
    // if you haven't started keeping track of stats for the System yet
    if (callTotals[call.shortName] === undefined) {
        callTotals[call.shortName] = 0;
    }
    callTotals[call.shortName]++;

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
}


// This gets called when a Time Period is up
exports.shiftStats = async function () {

    // Save talkgroupStats to a JSON file
    await saveJson("talkgroups.json", talkgroupStats);

    // for each system in talkgroupStats
    for (let shortName in talkgroupStats) {
        let callTotal = 0;

        // if the system is in stats
        if (talkgroupStats.hasOwnProperty(shortName)) {
            var sysTalkgroupStats = talkgroupStats[shortName];

            // for each talkgroup in that systems stats
            for (var talkgroupNum in sysTalkgroupStats) {
                if (sysTalkgroupStats.hasOwnProperty(talkgroupNum)) {
                    var tg = sysTalkgroupStats[talkgroupNum];
                    var tgHistoryTotal = 0;
                    if ((tg.callCountHistory == undefined) || (tg.callAvgLenHistory == undefined)) {
                        console.error("[" + shortName + "] Skipping stat for tg: " + talkgroupNum);
                        continue;
                    }
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
                    if (tgHistoryTotal == 0) {
                        // there has been no recent activity on this talkgroup. remove it from the stats.
                        delete sysTalkgroupStats[talkgroupNum];
                    }
                }
            }
        }
    }
    //console.log("Finished Shifting Talkgroup Stats at: " + new Date());
    await updateActiveSystems();
    //console.log("Finished Updating Active Systems at: " + new Date());
}


exports.siteStats = function (req, res) {
    const siteStats = {
        uploadsPerMin,
        activeSystems,
        totalClients: req.totalClients
    }
    res.contentType('json');
    res.send(JSON.stringify(siteStats));
};

exports.callTotals = function (shortName) {
    return callTotals[shortName];
}
exports.talkgroupStats = function (shortName) {
    return talkgroupStats[shortName];
}
