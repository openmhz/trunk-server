var ObjectID = require('mongodb').ObjectID;
var db = require('../db');
var mongoose = require("mongoose");
var Event = require("../models/event");
var { callModel: Call, callSchema } = require("../models/call");

/*
var oids = [];
ids.forEach(function(item){
oids.push(new ObjectId(item));
});
*/
const compareCalls = (a, b) => {
    const aTimestamp = new Date(a.time).getTime()
    const bTimestamp = new Date(b.time).getTime()
    if (aTimestamp > bTimestamp) {
        return -1
    } else {
        return 1
    }
}
exports.addNewEvent = async function (req, res, next) {
    process.nextTick(async function () {
        let event = new Event();
        if (!req.body) {
            console.error("No Request Body")
            next();
        }
        //console.log(req);
        console.log(req.body);
        const title = req.body.title;
        const description = req.body.description;
        const callIds = req.body.callIds;
        let objectIds = [];
        callIds.forEach((id) => {
            objectIds.push(new ObjectID(id));
        })
        
        event.title = title.replace(/[^a-zA-Z0-9 \.\-\_]/g, "");
        event.description = description.replace(/[^a-zA-Z0-9 \.\-\_]/g, "");
        try {
            let calls = await Call.find({ "_id": { $in: objectIds } });
            if (callIds.length != calls.length) {
                res.status(500);
                res.send("Not all of the Calls were found");
            }
            calls = calls.sort(compareCalls);
            event.startTime = new Date(calls[0].time).getTime();
            event.endTime = new Date(calls[calls.length - 1].time).getTime();
            event.expireTime = event.startTime;
            calls.forEach((call) => {
                if (event.shortNames.indexOf(call.shortName) === -1) {
                    event.shortNames.push(call.shortName);
                }
            });
            event.calls = calls;
            console.log(await event.save());
            res.contentType('json');
            res.send(JSON.stringify({
              success: false,
              error: "Upload failed"
            }));
        }
        catch (err) {
            console.error(err);
            res.status(500);
            res.send("Error parsing sourcelist " + err);
        }


    })
};