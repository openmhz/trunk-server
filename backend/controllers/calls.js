
const { ObjectId } = require('mongodb');
const Call = require("../models/call");
const Group = require("../models/group");
const StarredCall = require("../models/starred_call");
const media = require("./media");
const opentelemetry = require('@opentelemetry/api');
var defaultNumResults = 50;

var channels = {};

/**
 * Which of these calls has this listener starred?
 *
 * One query for the whole page rather than one per row. Returns a Set of hex
 * ids; an empty Set when nobody is signed in, which makes `star` false
 * everywhere rather than throwing.
 */
async function starred_ids_for(userId, items) {
    if (!userId || !items.length) return new Set();
    try {
        const ids = items.map(item => item._id);
        const rows = await StarredCall.find({ userId: userId, callId: { $in: ids } }, { callId: 1, _id: 0 });
        return new Set(rows.map(row => row.callId.toHexString()));
    } catch (err) {
        console.warn("Error - starred_ids_for() " + err);
        return new Set();
    }
}

/** Is this listener entitled to the enhanced features? */
function is_supporter(listener) {
    return !!(listener && listener.plan === 'supporter');
}

/**
 * What a given viewer is allowed to know about a call's transcript.
 *
 * Everyone gets a state so the UI can tell "there is no transcript" apart from
 * "there is one and it is not yours" - without that distinction the upsell has
 * nowhere to live and a free account just sees an empty pane. Only a Supporter
 * gets the text, and it is left out of the payload entirely rather than sent
 * and hidden in the browser.
 *
 * 'none' is deliberately the same answer for both: never dangle an upsell for a
 * transcript that does not exist. A call still being transcribed reads as 'none'
 * for a free account too, because at that point nobody knows whether it will
 * turn out to contain any speech.
 */
function transcript_for(item, supporter) {
    const status = item.transcriptStatus;
    const text = item.transcript && item.transcript.text;

    if (status === 'done' && text) {
        return supporter ? { transcriptState: 'ready', transcript: text } : { transcriptState: 'locked' };
    }
    if (status === 'pending' && supporter) {
        return { transcriptState: 'pending' };
    }
    return { transcriptState: 'none' };
}

const build_call_list = (items, starredIds, supporter) => {
    const starred = starredIds || new Set();
    let calls = [];
    for (var i=0; i < items.length; i++) {
        const item = items[i];
        call = {
            _id: item._id.toHexString(),
            talkgroupNum: item.talkgroupNum,
            url: item.url,
            filename: item.path + item.name,
            time: item.time,
            srcList: item.srcList,
            // "Have I starred this", not "how many people have". The old global
            // counter is no longer read.
            star: starred.has(item._id.toHexString()),
            freq: item.freq,
            patches: item.patches,
            len: Math.round(item.len),
            ...transcript_for(item, supporter)
        };
        calls.push(call);
    }
    return calls;
}

async function get_calls(query, numResults, middleDate, res, listener) {

    const userId = listener ? listener._id : null;
    const supporter = is_supporter(listener);

    var calls = [];
    var fields = {
        _id: true,
        // Needed to build the playback URL, which is namespaced by system.
        shortName: true,
        talkgroupNum: true,
        path: true,
        name: true,
        time: true,
        srcList: true,
        freq: true,
        patches: true,
        star: true,
        len: true,
        url: true,
        // Everyone needs the status, so the pane can say "not yours" rather than
        // showing nothing at all.
        transcriptStatus: true,
        // Read for everyone, returned only to Supporters - transcript_for is the
        // single place that decides. It has to be read even for a free account
        // because "there is a transcript you cannot see" and "there is no
        // transcript" are different answers, and the status alone cannot tell
        // them apart: a call can finish transcribing with no speech in it.
        //
        // Gating this at the projection as well looked safer and was worse. It
        // meant two places had to agree about one rule, they disagreed, and
        // every free account silently got 'none' where it should have seen the
        // upsell. One chokepoint, not two.
        'transcript.text': true
    };

    const sort = { length: -1 };
    try {
        const items =  await Call.find(query.filter, fields).sort(query.sort_order).limit(numResults);
        const refined_items = build_call_list(items, await starred_ids_for(userId, items), supporter);
        calls.push(...refined_items);

        // if we are loading a list of calls around a specific Call ID, we want to load call before and after that call, so we call it twice.
        if (middleDate) {
            query.filter.time = {
                $gt: middleDate
            };

            const items =  await Call.find(query.filter, fields).sort(query.sort_order).limit(numResults);
            const refined_items = build_call_list(items, await starred_ids_for(userId, items), supporter);
            calls.push(...refined_items);
        }
        res.json({
            calls: calls,
            direction: query.direction
        });
    } catch (err) {
        console.warn("Error - get_calls() Could not find item " + err + " filter: " + query.filter);
        res.send(404, 'Sorry, we cannot find that!');
        return;
    };
}

async function build_filter(filter_type, code, start_time, direction, shortName, numResults, starred, res, listener) {
    const userId = listener ? listener._id : null;
    var filter = {};
    var query = {};
    var start = new Date(start_time);

    // "Show only starred calls" means only the ones *this* listener starred.
    // Restricting by id up front keeps it a single indexed query; signed out
    // there is nothing to show, and an empty $in returns nothing, correctly.
    if (starred) {
        let starredIds = [];
        if (userId) {
            try {
                const rows = await StarredCall.find({ userId: userId, shortName: shortName }, { callId: 1, _id: 0 });
                starredIds = rows.map(row => row.callId);
            } catch (err) {
                console.warn("[" + shortName + "] Error - build_filter() loading stars " + err);
            }
        }
        filter._id = { $in: starredIds };
    }

    if (start_time) {

        if (direction == 'newer') {
            filter.time = {
                $gt: start
            };
        } else {
            filter.time = {
                $lt: start
            };
        }

    }


    var sort_order = {};
    if (direction == 'newer') {
        sort_order['time'] = 1;
    } else {
        sort_order['time'] = -1;
    }

    // make sure the shortName for the system is included in the query
    filter.shortName = shortName;

    query['direction'] = direction;
    query['sort_order'] = sort_order;



   if (filter_type) {
        if ((filter_type == "group") && code && (code.indexOf(',') == -1)) {
            let o_id
            try {
                o_id = ObjectId.createFromHexString(code);
            } catch (err) {
                console.warn("[" + shortName + "] Error - build_filter() group ObjectId is invalid " + err + " id: " + code);
                res.contentType('json');
                res.status(500);
                res.send(JSON.stringify({
                    error: err,
                    "_id": code
                }));
                return;
            }

            const group = await Group.findOne({ 'shortName': shortName, '_id': ObjectId.createFromHexString(code) }).exec();
            if (!group || !group.talkgroups) {
                console.warn("[" + shortName + "] Error - build_filter() group is null ");
                res.contentType('json');
                res.status(404);
                res.send(JSON.stringify({
                    message: 'That Group ID doesnt exist.'
                }));
                return;
            }
            filter.talkgroupNum = {
                $in: group.talkgroups
            };

        } else {
            if ((filter_type == "talkgroup") || (filter_type == "group")) {
                if (code) {
                    var codeArray = code.split(',').map(function (item) {
                        return parseInt(item, 10);
                    });
                    filter.talkgroupNum = {
                        $in: codeArray
                    };
                }
            }

        }
    } 

        if (direction=="middle") {
            query['filter'] = filter;
            get_calls(query, numResults, start, res, listener);
        } else {
            query['filter'] = filter;
            get_calls(query, numResults, false, res, listener);
        }

    
}


exports.get_card = async function (req, res) {
    var objectId = req.params.id;
    try {
        var o_id = ObjectId.createFromHexString(objectId);
    } catch (err) {
        console.warn("Error - /card/:id generating ObjectId " + err);
        res.status(500);
        res.send(JSON.stringify({
            error: err,
            "_id": objectId
        }));
        return;
    }

    const item = await Call.findById(o_id).exec();

    //console.log(util.inspect(item));
    if (item) {
        var time = new Date(item.time);
        var timeString = time.toLocaleTimeString("en-US");
        var dateString = time.toDateString();
        res.render('card', {
            item: item,
            channel: channels[item.talkgroupNum],
            time: timeString,
            date: dateString
        });
    } else {
        console.warn("Error - /card/:id Could not find Item " + err);
        res.send(404, 'Sorry, we cannot find that!');
    }
}

// starred and supporter are both per-listener, so the caller has to say. Both
// default to false, which is right for a call arriving over the socket: nobody
// has starred it yet, and it is broadcast to every connected client at once so
// it cannot carry anything entitlement-specific.
function package_call(item, starred, supporter) {
    var time = new Date(item.time);
    var timeString = time.toLocaleTimeString("en-US");
    var dateString = time.toDateString();
    call = {
        _id: item._id.toHexString(),
        shortName: item.shortName,
        talkgroupNum: item.talkgroupNum,
        filename: item.path + item.name,
        url: item.url,
        time: item.time,
        timeString: timeString,
        dateString: dateString,
        path: item.path,
        name: item.name,
        freq: item.freq,
        srcList: item.srcList,
        star: !!starred,
        len: Math.round(item.len),
        ...transcript_for(item, supporter)
    };
    return call;
}

/**
 * Both star routes are behind requireListener, so req.listener is the person
 * doing the starring. Nothing about the call document changes - a star is a row
 * in starred_calls belonging to one listener.
 */
function star_target(req, res) {
    var objectId = req.params.id;
    try {
        return ObjectId.createFromHexString(objectId);
    } catch (err) {
        console.warn("[" + req.params.shortName + "] Error - star route generating ObjectId " + err);
        res.status(500);
        res.send(JSON.stringify({
            success: false,
            message: "That is not a valid call id",
            "_id": objectId
        }));
        return null;
    }
}

exports.remove_star = async function (req, res, next) {
    const o_id = star_target(req, res);
    if (!o_id) return;

    const item = await Call.findById(o_id);
    if (!item) {
        res.status(404);
        res.send(JSON.stringify({ success: false, "_id": req.params.id }));
        return;
    }

    try {
        await StarredCall.deleteOne({ userId: req.listener._id, callId: o_id });
    } catch (err) {
        console.warn("Error - remove_star() " + err);
        res.status(500);
        res.send(JSON.stringify({ success: false, message: "Could not remove that star" }));
        return;
    }

    var call = package_call(item, false, is_supporter(req.listener));
    req.call = call;
    res.send(JSON.stringify({
        success: true,
        call: call
    }));
    next();
}


exports.add_star = async function (req, res, next) {
    const o_id = star_target(req, res);
    if (!o_id) return;

    const item = await Call.findById(o_id);
    if (!item) {
        res.status(404);
        res.send(JSON.stringify({ success: false, "_id": req.params.id }));
        return;
    }

    try {
        // Upsert rather than insert: starring twice is not an error, and the
        // unique index would reject the second row anyway.
        await StarredCall.updateOne(
            { userId: req.listener._id, callId: o_id },
            { $setOnInsert: { shortName: item.shortName, createdAt: new Date() } },
            { upsert: true }
        );
    } catch (err) {
        console.warn("Error - add_star() " + err);
        res.status(500);
        res.send(JSON.stringify({ success: false, message: "Could not star that call" }));
        return;
    }

    var call = package_call(item, true, is_supporter(req.listener));
    req.call = call;
    res.send(JSON.stringify({
        success: true,
        call: call
    }));
    next();
}


exports.get_call = async function (req, res) {
    var objectId = req.params.id;
    try {
        var o_id = ObjectId.createFromHexString(objectId);
    } catch (err) {
        console.warn("[" + req.params.shortName + "] Error - /:shortName/call/:id generating ObjectId " + err);
        res.status(500);
        res.send(JSON.stringify({
            success: false,
            error: err,
            "_id": objectId
        }));
        return;
    }
    const item = await Call.findById(o_id).exec();

    if (item) {
        // Gated by requireListener, so this can say whether the person asking
        // has starred it - a single call opened by link should show the same
        // star state as it does in the list.
        const starredIds = await starred_ids_for(req.listener ? req.listener._id : null, [item]);
        var call = package_call(item, starredIds.has(item._id.toHexString()), is_supporter(req.listener));
        res.contentType('json');
        res.send(JSON.stringify({
            success: true,
            call: call
        })
        );

    } else {
        console.warn("[" + req.params.shortName + "] Error - /:shortName/call/:id Could not find item ID: " + objectId);
        res.status(404);
        res.send(JSON.stringify({
            success: false,
            "_id": objectId
        }));
    }

}

// This is what you use when you want to get some calls before and after a timestamp.

exports.get_date_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.query["time"]);
    var short_name = req.params.shortName.toLowerCase();
    // requireListener guarantees this on the gated routes; the iphone route is
    // ungated legacy and has neither stars nor transcripts to show.
    var listener = req.listener;
    //console.log("[" + short_name + "] Next Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, start_time, 'middle', short_name, defaultNumResults, starred, res, listener);
}


exports.get_latest_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var short_name = req.params.shortName.toLowerCase();
    // requireListener guarantees this on the gated routes; the iphone route is
    // ungated legacy and has neither stars nor transcripts to show.
    var listener = req.listener;
    //console.log("[" + short_name + "] Latest -  Call Get Filter code: " + filter_code + " Filter Type: " + filter_type );

    build_filter(filter_type, filter_code, null, 'older', short_name, 1, starred, res, listener);
}


exports.get_next_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.query["time"]);
    var short_name = req.params.shortName.toLowerCase();
    // requireListener guarantees this on the gated routes; the iphone route is
    // ungated legacy and has neither stars nor transcripts to show.
    var listener = req.listener;
    //console.log("[" + short_name + "] Next Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, start_time, 'newer', short_name, 1, starred, res, listener);
}

exports.get_newer_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.query["time"]);
    var short_name = req.params.shortName.toLowerCase();
    // requireListener guarantees this on the gated routes; the iphone route is
    // ungated legacy and has neither stars nor transcripts to show.
    var listener = req.listener;
    //console.log("[" + short_name + "] Newer Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type );

    build_filter(filter_type, filter_code, start_time, 'newer', short_name, defaultNumResults, starred, res, listener);
}

exports.get_older_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.query["time"]);
    var short_name = req.params.shortName.toLowerCase();
    // requireListener guarantees this on the gated routes; the iphone route is
    // ungated legacy and has neither stars nor transcripts to show.
    var listener = req.listener;
    //console.log("[" + short_name + "] Older Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, start_time, 'older', short_name, defaultNumResults, starred, res, listener);
}


//Delete this after I fix the iPhone app
exports.get_iphone_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.params.time);
    var short_name = req.params.shortName.toLowerCase();
    // requireListener guarantees this on the gated routes; the iphone route is
    // ungated legacy and has neither stars nor transcripts to show.
    var listener = req.listener;
    //console.log("[" + short_name + "] iPhone Newer Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, start_time, 'older', short_name, defaultNumResults, starred, res, listener);
}

exports.get_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var short_name = req.params.shortName.toLowerCase();
    // requireListener guarantees this on the gated routes; the iphone route is
    // ungated legacy and has neither stars nor transcripts to show.
    var listener = req.listener;
    //console.log("[" + short_name + "] Inital Calls -  Call Get Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, null, 'older', short_name, defaultNumResults, starred, res, listener);
}
