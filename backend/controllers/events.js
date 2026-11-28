
const { ObjectId } = require('mongodb');
const { spawn } = require('node:child_process');
const https = require('https');
var Event = require("../models/event");
var Podcast = require("../models/podcast");
var System = require("../models/system");
var Talkgroup = require("../models/talkgroup");
const AdmZip = require("adm-zip");
const  Call = require("../models/call");

var frontend_server = process.env['REACT_APP_FRONTEND_SERVER'] != null ? process.env['REACT_APP_FRONTEND_SERVER'] : 'https://openmhz.com';
const os = require('os');
var fs = require('fs');

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-providers");

var s3_endpoint = process.env['S3_ENDPOINT'] != null ? process.env['S3_ENDPOINT'] : 'https://s3.us-west-1.wasabisys.com';
var s3_region = process.env['S3_REGION'] != null ? process.env['S3_REGION'] : 'us-west-1';
var s3_bucket = process.env['S3_BUCKET'] != null ? process.env['S3_BUCKET'] : 'openmhz-west';
var s3_profile = process.env['S3_PROFILE'] != null ? process.env['S3_PROFILE'] : 'wasabi-account';

// The largest event so far had 610 calls.
const MAX_EVENT_CALLS = 1000;
const MAX_TEXT_LENGTH = 500;
const DOWNLOAD_TIMEOUT_MS = 30 * 1000;
// Packaging can take minutes: one job at a time keeps a burst of submissions
// from saturating the API process.
const packagingQueue = [];
let packagingBusy = false;

const client = new S3Client({
    credentials: fromIni({ profile: s3_profile }),
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    endpoint: s3_endpoint,
    region: s3_region,
    maxAttempts: 2
});

function badRequest(res, message) {
    res.status(400).json({ success: false, message: message });
}

exports.getEvent = async function (req, res, next) {
    const objectId = req.params.id;
    if (!ObjectId.isValid(objectId) || String(objectId).length !== 24) {
        res.status(404).json({ success: false, message: "Event not found" });
        return;
    }
    try {
        const event = await Event.findById(objectId).exec();
        if (!event) {
            res.status(404).json({ success: false, message: "Event not found" });
            return;
        }
        res.contentType('json');
        res.send(JSON.stringify(event));
    }
    catch (err) {
        console.error("Error fetching Event " + objectId + ": " + err);
        res.status(500).send(`Error fetching Event ${objectId}`);
    }
}

exports.getEvents = async function (req, res, next) {
    try {
        let events = await Event.find({}, ["title", "description", "startTime", "endTime", "expireTime", "numCalls", "createdAt", "shortNames"]).exec();
        res.contentType('json');
        res.send(JSON.stringify(events));
    }
    catch (err) {
        console.error("Error fetching Events " + err);
        res.status(500).send("Error fetching Events");
    }
}


// Resolves once the file is fully written. Rejects on a non-200 response or a
// stalled download, instead of saving an S3 error page as audio.
function downloadFile(folderName, url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            if (response.statusCode !== 200) {
                response.resume();
                reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
                return;
            }
            const filename = new URL(url).pathname.split('/').pop();
            const filePath = `${folderName}/${filename}`;
            const stream = fs.createWriteStream(filePath);
            response.on("error", reject);
            stream.on("error", reject);
            stream.on("finish", () => stream.close(() => resolve()));
            response.pipe(stream);
        });
        request.on("error", reject);
        request.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
            request.destroy(new Error(`Download timed out: ${url}`));
        });
    });
}


const exportEventJson = (eventFolder, event) => {
    const filename = eventFolder + "/event.json";
    fs.writeFileSync(filename, JSON.stringify(event));
}

const createEventZip = (folder, filename, zipFolder) => {
    const zip = new AdmZip();
    zip.addLocalFolder(folder, zipFolder);
    zip.writeZip(filename);
    console.log(`Created ${filename} successfully for event from ${folder}`);
}


// Throws if the file is missing or the upload fails. Previously a missing file
// emitted an unhandled stream 'error', which crashed the whole API (the
// production crashes on 2026-11-24 and 2026-11-25).
const uploadFile = async (localFile, s3File) => {
    const { size } = await fs.promises.stat(localFile);
    const body = fs.createReadStream(localFile);
    let streamError = null;
    body.on("error", (err) => { streamError = err; });
    try {
        await client.send(new PutObjectCommand({
            Bucket: s3_bucket,
            Key: s3File,
            Body: body,
            ContentLength: size,
            ACL: 'public-read'
        }));
    } finally {
        body.destroy();
    }
    if (streamError) {
        throw streamError;
    }
}


const ffmpeg = (command) => {
    // https://stackoverflow.com/questions/68101810/how-to-execute-ffmpeg-commands-synchronously
    return new Promise((resolve, reject) => {
        const proc = spawn("/usr/bin/ffmpeg", command);
        // Without this a failure to start ffmpeg is an unhandled 'error' event.
        proc.once('error', reject);
        proc.stderr.on("data", (data) => {
            console.error(data.toString());
        });
        proc.stdout.on("data", () => {});
        proc.on("exit", (code, signal) => {
            if (signal) {
                reject(new Error(`ffmpeg killed by ${signal}`));
            } else if (code !== 0) {
                reject(new Error(`ffmpeg returned exit code ${code}`));
            } else {
                resolve();
            }
        });
    });
};

const escapeMetadata = (input) => {
    if (typeof input === 'string') {
        let result = input.replace(/(\\)/g, '\\\\');
        result = result.replace(/(\;)/g, '\\;');
        result = result.replace(/(\#)/g, '\\#');
        result = result.replace(/(\=)/g, '\\=');
        // A newline would start a new metadata key.
        result = result.replace(/[\r\n]+/g, ' ');
        return result;
    } else {
        return "";
    }
}
const createChapters = (event) => {
    let chapters = ";FFMETADATA1\n";
    let totalTime = 0;
    chapters = chapters + "title=" + escapeMetadata(event.title) + "\n";
    chapters = chapters + "artist=OpenMHz\n";
    for (const call of event.calls) {
        chapters = chapters + "[CHAPTER]\nTIMEBASE=1/1000\nSTART=" + Math.round(totalTime * 1000) + "\n";
        totalTime = totalTime + (call.len || 0);
        chapters = chapters + "END=" + Math.round(totalTime * 1000) + "\n";
        chapters = chapters + "title=" + escapeMetadata(call.talkgroupDescription) + "\n";
    }
    return chapters;
}

// Throws if ffmpeg fails; the caller decides what to skip.
const createPodcast = async (tmpEventFolder, podcastFile, event) => {
    const tmpFile = tmpEventFolder + "/tmp.m4a";
    let concat = "";
    for (const call of event.calls) {
        const filename = tmpEventFolder + "/" + new URL(call.url).pathname.split('/').pop();
        concat = concat + "file '" + filename.replace(/'/g, "'\\''") + "'\n";
    }
    const concatFile = tmpEventFolder + "/FILES.txt";
    fs.writeFileSync(concatFile, concat, "utf8");
    // https://video.stackexchange.com/questions/21315/concatenating-split-media-files-using-concat-protocol
    await ffmpeg(["-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatFile, "-acodec", "aac", tmpFile]);

    const chaptersFile = tmpEventFolder + "/CHAPTERS.txt";
    fs.writeFileSync(chaptersFile, createChapters(event), "utf8");
    await ffmpeg(["-hide_banner", "-loglevel", "error", "-i", tmpFile, "-i", chaptersFile, "-map_metadata", "1", "-codec", "copy", podcastFile]);
}

const cleanupEvent = (folder, filename) => {
    fs.rmSync(folder, { recursive: true, force: true });
    fs.rmSync(filename, { force: true });
}

const savePodcast = async (event, podcastUrl) => {
    let podcast = new Podcast(event.toObject());
    podcast.downloadUrl = podcastUrl;
    let totalTime = 0;
    event.calls.forEach((call) => {
        totalTime = totalTime + (call.len || 0);
        if (call.systemName && podcast.systems.indexOf(call.systemName) === -1) {
            podcast.systems.push(call.systemName);
        }
    });
    podcast.len = totalTime;
    podcast.eventUrl = frontend_server + "/events/" + event._id;
    await podcast.save();
}

// Builds the zip and the podcast for a saved event. Each half is independent:
// if the podcast fails the zip is still published.
const packageEvent = async (eventId) => {
    const event = await Event.findById(eventId).exec();
    if (!event) {
        throw new Error("Unable to load Event " + eventId);
    }
    const tmpdir = os.tmpdir();
    let eventFolder = "event_" + Date.now();
    event.shortNames.forEach((shortName) => {
        eventFolder = eventFolder + "_" + shortName;
    });
    const tmpEventFolder = tmpdir + "/" + eventFolder;
    const zipFile = tmpdir + "/" + eventFolder + ".zip";
    const podcastFile = tmpEventFolder + "/" + eventFolder + ".m4a";
    const s3ZipFile = "events/" + eventFolder + ".zip";
    const s3PodcastFile = "podcasts/" + eventFolder + ".m4a";

    try {
        fs.mkdirSync(tmpEventFolder, { recursive: true });

        for (const call of event.calls) {
            await downloadFile(tmpEventFolder, call.url);
        }

        exportEventJson(tmpEventFolder, event);
        createEventZip(tmpEventFolder, zipFile, eventFolder);
        await uploadFile(zipFile, s3ZipFile);
        event.downloadUrl = s3_endpoint + "/" + s3_bucket + "/" + s3ZipFile;
        await event.save();

        try {
            await createPodcast(tmpEventFolder, podcastFile, event);
            await uploadFile(podcastFile, s3PodcastFile);
            const podcastUrl = s3_endpoint + "/" + s3_bucket + "/" + s3PodcastFile;
            event.podcastUrl = podcastUrl;
            await event.save();
            await savePodcast(event, podcastUrl);
        } catch (err) {
            console.error("Event " + eventId + ": podcast skipped: " + err);
        }
    } finally {
        cleanupEvent(tmpEventFolder, zipFile);
    }
};

function enqueuePackaging(eventId) {
    packagingQueue.push(eventId);
    runPackagingQueue();
}

async function runPackagingQueue() {
    if (packagingBusy) return;
    packagingBusy = true;
    try {
        while (packagingQueue.length > 0) {
            const eventId = packagingQueue.shift();
            const started = Date.now();
            try {
                await packageEvent(eventId);
                console.log("Packaged event " + eventId + " in " + Math.round((Date.now() - started) / 1000) + "s");
            } catch (err) {
                console.error("Failed packaging event " + eventId + ": " + ((err && err.stack) || err));
            }
        }
    } finally {
        packagingBusy = false;
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

    for (const call of calls) {
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

const cleanText = (value) => String(value).replace(/[^a-zA-Z0-9 \.\-\_]/g, "").slice(0, MAX_TEXT_LENGTH);

exports.addNewEvent = async function (req, res) {
    const body = req.body || {};
    const { title, description, callIds } = body;

    if (typeof title !== "string" || title.trim() === "") {
        return badRequest(res, "A title is required.");
    }
    if (description !== undefined && typeof description !== "string") {
        return badRequest(res, "Description must be text.");
    }
    if (!Array.isArray(callIds) || callIds.length === 0) {
        return badRequest(res, "Add at least one call to the event.");
    }
    if (callIds.length > MAX_EVENT_CALLS) {
        return badRequest(res, `An event can have at most ${MAX_EVENT_CALLS} calls.`);
    }
    const uniqueIds = [...new Set(callIds)];
    if (!uniqueIds.every((id) => typeof id === "string" && id.length === 24 && ObjectId.isValid(id))) {
        return badRequest(res, "One or more call ids are invalid.");
    }
    const objectIds = uniqueIds.map((id) => ObjectId.createFromHexString(id));

    let calls;
    try {
        calls = await Call.find({ "_id": { $in: objectIds } });
    } catch (err) {
        console.error("Error creating event: " + err);
        res.status(500).send("Error creating event");
        return;
    }
    if (calls.length !== uniqueIds.length) {
        res.status(500).send("Not all of the Calls were found");
        return;
    }

    const event = new Event();
    event.title = cleanText(title);
    event.description = cleanText(description || "");
    calls = calls.sort(compareCalls);
    event.endTime = new Date(calls[0].time);
    event.startTime = new Date(calls[calls.length - 1].time);
    // 29 days after the first call. (This used setDate() on today's date with the
    // start's day-of-month, which gave the wrong day across month boundaries.)
    event.expireTime = new Date(event.startTime.getTime() + 29 * 24 * 60 * 60 * 1000);
    event.numCalls = calls.length;
    calls.forEach((call) => {
        if (event.shortNames.indexOf(call.shortName) === -1) {
            event.shortNames.push(call.shortName);
        }
    });

    try {
        event.calls = await freezeCalls(calls);
        await event.save();
    } catch (err) {
        console.error("Error creating event: " + err);
        res.status(500).send("Error creating event");
        return;
    }

    // Answer now and package in the background. The request used to stay open
    // for the whole download/zip/ffmpeg run, so people resubmitted and several
    // copies of the same event were packaged at once. The event page shows the
    // download link once packaging has filled it in.
    res.contentType('json');
    res.send(JSON.stringify({ url: "/events/" + event._id }));
    enqueuePackaging(event._id);
};

// Exposed for tests only.
exports._internal = { uploadFile, downloadFile };
