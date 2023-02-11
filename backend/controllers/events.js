var ObjectID = require('mongodb').ObjectID;
const https = require('https');
var db = require('../db');
var mongoose = require("mongoose");
var Event = require("../models/event");
const AdmZip = require("adm-zip");
var { callModel: Call, callSchema } = require("../models/call");
var frontend_server = process.env['REACT_APP_FRONTEND_SERVER'] != null ? process.env['REACT_APP_FRONTEND_SERVER'] : 'https://openmhz.com';
const os = require('os');
var fs = require('fs');

const s3 = require('aws-sdk');
const { events } = require('../models/event');

var s3_endpoint = process.env['S3_ENDPOINT'] != null ? process.env['S3_ENDPOINT'] : 's3.us-west-1.wasabisys.com';
var s3_bucket = process.env['S3_BUCKET'] != null ? process.env['S3_BUCKET'] : 'openmhz-west';
var s3_profile = process.env['S3_PROFILE'] != null ? process.env['S3_PROFILE'] : 'wasabi-account';

const s3Endpoint = new s3.Endpoint(s3_endpoint);
var s3Credentials = new s3.SharedIniFileCredentials({
    profile: s3_profile
});

s3.config.credentials = s3Credentials;
const s3S3 = new s3.S3({
    endpoint: s3Endpoint,
    maxRetries: 2
});



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
        let events = await Event.find({}, ["title", "description", "startTime", "endTime", "expireTime", "numCalls", "createdAt", "shortNames"]).exec();
        res.contentType('json');
        res.send(JSON.stringify(events));
    }
    catch (err) {
        console.error(err);
        res.status(500);
        res.send("Error fetching Events" + err);
    }
}



async function downloadFile(folderName, url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const filename = new URL(url).pathname.split('/').pop();
            const filePath = `${folderName}/${filename}`;
            console.log("Downloading to filename " + filename + " and filePath " + filePath);
            let stream = fs.createWriteStream(filePath);

            response.on("error", reject);

            stream.on("finish", () => {
                stream.close();
                console.log("Download Completed");
                resolve();
            }).on("error", reject);

            response.pipe(stream);

        }).on("error", reject);
    });
}


const exportEventJson = (eventFolder, event) => {
    const filename = eventFolder + "/event.json";
    fs.writeFileSync(filename, JSON.stringify(event));
}

const createEventZip = async (folder, filename, zipFolder) => {
    try {
        const zip = new AdmZip();
        zip.addLocalFolder(folder, zipFolder);
        zip.writeZip(filename);
        console.log(`Created ${filename} successfully for event from ${folder}`);
    } catch (e) {
        console.error("Event Error trying to zip: " + filename + " error: " + e);
    }
}

const uploadEventZip = (zipFile, s3File) => {

    // If not a pro plan, use S3 storage

    var s3Src = fs.createReadStream(zipFile);
    return new Promise((resolve, reject) => {
        const s3Params = {
            Bucket: s3_bucket,
            Key: s3File,
            Body: s3Src,
            ACL: 'public-read'
        };

        s3S3.upload(s3Params, function (err, data) {
            s3Src.destroy();

            if (err) {
                console.error("Event S3 Upload Error " + err);
                reject(err);
            } else {
                resolve("done");
            }
        });
    });
}

const cleanupEvent = (folder, filename) => {
    fs.rmSync(folder, { recursive: true, force: true });
    fs.rmSync(filename);
}

const packageEvent = (eventId) => {
    const event = "tst"
    const tmpdir = os.tmpdir();
    return new Promise(async (resolve, reject) => {
        var objectId = eventId;
        const event = await Event.findById(objectId).exec();
        if (!event) {
            reject("Unable to load Event " + eventId);
        }
        let eventFolder = "event_" + Date.now();
        event.shortNames.forEach((shortName) => {
            eventFolder = eventFolder + "_" + shortName;
        });
        const tmpEventFolder = tmpdir + "/" + eventFolder
        const zipFile = tmpdir + "/" + eventFolder + ".zip"
        const s3File = "events/" + eventFolder + ".zip"
        console.log("Using tmp " + tmpEventFolder);

        try {
            if (!fs.existsSync(tmpEventFolder)) {
                fs.mkdirSync(tmpEventFolder);
            }

            for (const call of event.calls) {
                await downloadFile(tmpEventFolder, call.url)
            }


            exportEventJson(tmpEventFolder, event);
            createEventZip(tmpEventFolder, zipFile, eventFolder);
            await uploadEventZip(zipFile, s3File);
            var url = 'https://' + s3_endpoint + "/" + s3_bucket + "/" + s3File;
            event.downloadUrl = url;
            await event.save();

        } catch (e) {
            console.error("Failed processing event " + e);
            reject(e);
        }
        cleanupEvent(tmpEventFolder, zipFile);
        resolve('resolved');

    });
};


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
            const savedEvent = await event.save();
            console.log("Event ID " + savedEvent._id);
            await packageEvent(savedEvent._id);
            const url = "/events/" + event._id;
            res.contentType('json');
            res.send(JSON.stringify({ url: url }));
        }
        catch (err) {
            console.error(err);
            res.status(500);
            res.send("Error creating event" + err);
        }


    })
};


