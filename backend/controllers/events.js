var ObjectID = require('mongodb').ObjectID;
var db = require('../db');
var mongoose = require("mongoose");
var Event = require("../models/event");
var { callModel: Call, callSchema } = require("../models/call");
var frontend_server = process.env['REACT_APP_FRONTEND_SERVER'] != null ? process.env['REACT_APP_FRONTEND_SERVER'] : 'https://openmhz.com';


exports.getEvent = async function (req, res, next) {

    try {
        var objectId = req.params.id;
        const event = await Event.findById(objectId).exec();
        res.contentType('json');
        res.send(JSON.stringify(event));
    }
    catch (err) {
        console.error(err);
        res.status(500);
        res.send(`Error fetching Event ${req.params.id}: ` + err);
    }
}

exports.getEvents = async function (req, res, next) {
    try {
        let events = await Event.find({},["title",  "description", "startTime", "endTime", "expireTime", "numCalls", "createdAt", "shortNames"]).exec();
        res.contentType('json');
        res.send(JSON.stringify(events));
    }
    catch (err) {
        console.error(err);
        res.status(500);
        res.send("Error fetching Events" + err);
    }
}

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
            event.endTime = new Date(calls[0].time);
            event.startTime = new Date(calls[calls.length - 1].time);
            event.expireTime = new Date();
            event.expireTime.setDate(event.startTime.getDate() + 29);
            calls.forEach((call) => {
                if (event.shortNames.indexOf(call.shortName) === -1) {
                    event.shortNames.push(call.shortName);
                }
            });
            event.calls = calls;
            event.numCalls = calls.length;
            await event.save();
            
            const url =  "/events/" + event._id;
            res.contentType('json');
            res.send(JSON.stringify({url:url}));
        }
        catch (err) {
            console.error(err);
            res.status(500);
            res.send("Error creating event" + err);
        }


    })
};