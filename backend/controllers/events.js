var ObjectID = require('mongodb').ObjectID;
const { spawn, spawnSync } = require('node:child_process');
const https = require('https');
var db = require('../db');
var mongoose = require("mongoose");
var Event = require("../models/event");
var Podcast = require("../models/podcast");
var System = require("../models/system");
var Talkgroup = require("../models/talkgroup");
const AdmZip = require("adm-zip");
var { callModel: Call, frozenCallModel: FrozenCall } = require("../models/call");

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
        console.log("Trying to download: " + url)
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


const uploadFile = (zipFile, s3File) => {
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


const ffmpeg = async (command) => {
// https://stackoverflow.com/questions/68101810/how-to-execute-ffmpeg-commands-synchronously
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn("/usr/bin/ffmpeg", command);
        //ffmpeg.once('error', reject);
        ffmpeg.stderr.on("data", (data) => {
            console.error(data.toString()); //I'm not sure what debug is
          });
        ffmpeg.stdout.on("data", (data) => {
            //console.log(data.toString()); //I'm not sure what debug is
          });
        ffmpeg.on("exit", (code, signal) => {
            if (signal)
                code = signal;
            if (code != 0) {
                reject(`Returned exit code ${code}`);
                console.log('Error');
            }
            else {
                resolve(); // Call resolve here
                console.log('DONE');
            }
        });
    });
};

const escapeMetadata = (input) => {
    let result = input.replace(/(\\)/g, '\\\\');
    result=result.replace(/(\;)/g, '\\;');
    result=result.replace(/(\#)/g, '\\#');
    result=result.replace(/(\=)/g, '\\=');
    return result;
}
const createChapters = (event) => {
    let chapters = ";FFMETADATA1\n";
    let totalTime = 0;
    chapters = chapters + "title=" + escapeMetadata(event.title) + "\n";
    chapters = chapters + "artist=OpenMHz\n";
    for (const call of event.calls) {
        chapters = chapters + "[CHAPTER]\nTIMEBASE=1/1000\nSTART=" + (totalTime * 1000) + "\n";
        totalTime = totalTime + call.len;
        chapters = chapters + "END=" + (totalTime * 1000) + "\n";
        chapters = chapters + "title=" + escapeMetadata(call.talkgroupDescription) + "\n";
    }
    console.log("Chapters: \n" + chapters);
    return chapters;
}

const createPodcast = async (tmpEventFolder, podcastFile, event) => {
    let inputs = [];
    let command = [];
    let concat = "";
    let tmpFile = tmpEventFolder + "/tmp.m4a"
    for (const call of event.calls) {
        const filename = tmpEventFolder + "/" + new URL(call.url).pathname.split('/').pop();
        console.log("Adding to podcast: " + filename)
        inputs.push(filename);

    }
    inputs.forEach((value, i) => {
        concat = concat + "file '" + value + "'\n";
    });
    const concatFile = tmpEventFolder + "/FILES.txt"
    fs.writeFileSync(concatFile, concat, "utf8");
    // https://video.stackexchange.com/questions/21315/concatenating-split-media-files-using-concat-protocol
    //ffmpeg -f concat -safe 0 -i mylist.txt -c copy output
    command.push("-f");
    command.push("concat");
    command.push("-safe");
    command.push("0");
    command.push("-i");
    command.push(concatFile);
    command.push("-acodec");
    command.push("copy");
    command.push(tmpFile);
    console.log("Running command: " + command);
    await ffmpeg(command);


    const chapters = createChapters(event);
    const chaptersFile = tmpEventFolder + "/CHAPTERS.txt"
    fs.writeFileSync(chaptersFile, chapters, "utf8");
    command = [];
    command.push("-i");
    command.push(tmpFile)
    command.push("-i");
    command.push(chaptersFile)
    command.push("-map_metadata")
    command.push("1")
    command.push("-codec");
    command.push("copy");
    command.push(podcastFile)
    console.log("Running command: " + command);
    await ffmpeg(command);
}

const cleanupEvent = (folder, filename) => {
    fs.rmSync(folder, { recursive: true, force: true });
    fs.rmSync(filename);
}

const savePodcast = (event, podcastUrl) => {
    let podcast = new Podcast(event.toObject());
    podcast.downloadUrl = podcastUrl;
    let totalTime = 0;
    event.calls.forEach((call) => {
        totalTime = totalTime + call.len;
        if (podcast.systems.indexOf(call.systemName) === -1) {
            podcast.systems.push(call.systemName);
        }
    });
    podcast.len = totalTime;
    podcast.save();
}

const packageEvent = (eventId) => {
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
        const zipFile = tmpdir + "/" + eventFolder + ".zip";
        const podcastFile = tmpEventFolder + "/" + eventFolder + ".m4a";
        const s3ZipFile = "events/" + eventFolder + ".zip";
        const s3PodcastFile = "podcasts/" + eventFolder + ".m4a";
        console.log("Using tmp " + tmpEventFolder);

        try {
            if (!fs.existsSync(tmpEventFolder)) {
                console.log("Creating tmp Folder");
                fs.mkdirSync(tmpEventFolder);
            }

            for (const call of event.calls) {
                await downloadFile(tmpEventFolder, call.url)
            }


            exportEventJson(tmpEventFolder, event);
            createEventZip(tmpEventFolder, zipFile, eventFolder);
            await uploadFile(zipFile, s3ZipFile);
            
            const downloadUrl = 'https://' + s3_endpoint + "/" + s3_bucket + "/" + s3ZipFile;
            const podcastUrl = 'https://' + s3_endpoint + "/" + s3_bucket + "/" + s3PodcastFile;
            event.downloadUrl = downloadUrl;
            await event.save();
            await createPodcast(tmpEventFolder, podcastFile, event);
            await uploadFile(podcastFile,s3PodcastFile);
            await savePodcast(event,podcastUrl);
            console.log("uploaded to: " + podcastUrl);


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

const freezeCalls = async (calls) => {
    let talkgroups = {}
    let systems = {}
    let frozenCalls = []

    const getSystem = async (shortName) => {
        if (!systems.hasOwnProperty(shortName)) {
            systems[shortName] = await System.findOne({ "shortName": shortName });
        }
        return systems[shortName];
    }

    const getTalkgroup = async (shortName, tgNum) => {

        if (!talkgroups.hasOwnProperty(shortName)) {
            talkgroups[shortName] = {};
        }
        if (!talkgroups[shortName][tgNum]) {
            talkgroups[shortName][tgNum] = await Talkgroup.findOne({ "shortName": shortName, "num": tgNum });
        }
        return talkgroups[shortName][tgNum];
    }

    for (const i in calls) {
        const call = calls[i];
        const talkgroup = await getTalkgroup(call.shortName, call.talkgroupNum);
        const system = await getSystem(call.shortName);

        // we do this so we can copy the object data to a new Model that has some additional fields.
        let frozenCall = call.toObject();
        delete frozenCall._id;
        if (system) {
            frozenCall["systemName"] = system.name;
            frozenCall.systemDescription = system.description;
        }
        if (talkgroup) {
            frozenCall.talkgroupAlpha = talkgroup.alpha;
            frozenCall.talkgroupDescription = talkgroup.description;
        }
        frozenCalls.push(frozenCall);
    };
    return frozenCalls;
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
            event.numCalls = calls.length;
            calls.forEach((call) => {
                if (event.shortNames.indexOf(call.shortName) === -1) {
                    event.shortNames.push(call.shortName);
                }
            });
            event.calls = await freezeCalls(calls);

            const savedEvent = await event.save();
            console.log("Event ID " + savedEvent._id);
            const url = "/events/" + event._id;
            res.contentType('json');
            res.send(JSON.stringify({ url: url }));

            await packageEvent(savedEvent._id);

        }
        catch (err) {
            console.error(err);
            res.status(500);
            res.send("Error creating event" + err);
        }


    })
};


