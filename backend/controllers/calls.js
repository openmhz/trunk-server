
const { ObjectId } = require('mongodb');
const Call = require("../models/call");
const Group = require("../models/group");
const { str } = require("../lib/safety");
var defaultNumResults = 50;

var channels = {};

const build_call_list = (items) => {
    let calls = [];
    for (var i=0; i < items.length; i++) {
        const item = items[i];
        const call = {
            _id: item._id.toHexString(),
            talkgroupNum: item.talkgroupNum,
            url: item.url,
            filename: item.path + item.name,
            time: item.time,
            // Lean results skip schema defaults, so older documents can lack these.
            srcList: item.srcList ?? [],
            star: item.star ?? 0,
            emergency: item.emergency,
            freq: item.freq,
            patches: item.patches ?? [],
            len: Math.round(item.len)
        };
        calls.push(call);
    }
    return calls;
}

// Parse a 24-character hex id, or return null.
function parseObjectId(id) {
    if (typeof id !== "string" || id.length !== 24 || !ObjectId.isValid(id)) {
        return null;
    }
    return ObjectId.createFromHexString(id);
}

async function get_calls(query, numResults, middleDate, res) {

    var calls = [];
    var fields = {
        _id: true,
        talkgroupNum: true,
        path: true,
        name: true,
        time: true,
        emergency: true,
        srcList: true,
        freq: true,
        patches: true,
        star: true,
        len: true,
        url: true
    };

    try {
        const items =  await Call.find(query.filter, fields).sort(query.sort_order).limit(numResults).lean();
        const refined_items = build_call_list(items);
        calls.push(...refined_items);

        // if we are loading a list of calls around a specific Call ID, we want to load call before and after that call, so we call it twice.
        if (middleDate) {
            query.filter.time = {
                $gt: middleDate
            };

            const items =  await Call.find(query.filter, fields).sort(query.sort_order).limit(numResults).lean();
            const refined_items = build_call_list(items);
            calls.push(...refined_items);
        }
        res.json({
            calls: calls,
            direction: query.direction
        });
    } catch (err) {
        console.warn("Error - get_calls() Could not find item " + err + " filter: " + JSON.stringify(query.filter));
        res.status(404).send('Sorry, we cannot find that!');
    };
}

// Query values arrive as strings, but ?filter-code[]=1 or ?filter-code=a&filter-code=b
// make them arrays and ?filter-code[x]=1 makes an object. Anything that is not a
// plain string is treated as absent rather than crashing the process.
function readFilterQuery(req) {
    return {
        filter_code: str(req.query["filter-code"]),
        filter_type: str(req.query["filter-type"]),
        starred: req.query["filter-starred"] === 'true',
    };
}

async function build_filter(filter_type, code, start_time, direction, shortName, numResults, starred, res) {
    var filter = {};
    var query = {};
    var start = new Date(start_time);

    // NaN or missing times mean "no time", as they always have; only a real time filters.
    const hasStart = Boolean(start_time) && !isNaN(start.getTime());

    if (hasStart) {

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
            const o_id = parseObjectId(code);
            if (!o_id) {
                console.warn("[" + shortName + "] Error - build_filter() group ObjectId is invalid id: " + code);
                res.status(400).json({
                    message: 'Invalid Group ID.',
                    "_id": code
                });
                return;
            }

            const group = await Group.findOne({ 'shortName': shortName, '_id': o_id }).exec();
            if (!group || !group.talkgroups) {
                console.warn("[" + shortName + "] Error - build_filter() group is null ");
                res.status(404).json({
                    message: 'That Group ID doesnt exist.'
                });
                return;
            }
            filter.talkgroupNum = {
                $in: group.talkgroups
            };

        } else {
            if ((filter_type == "talkgroup") || (filter_type == "group")) {
                if (code) {
                    // Drop anything that is not a number instead of letting the
                    // query fail with a CastError.
                    var codeArray = code.split(',')
                        .map((item) => parseInt(item, 10))
                        .filter((num) => Number.isFinite(num));
                    if (codeArray.length === 0) {
                        res.status(400).json({ message: 'Invalid filter-code.' });
                        return;
                    }
                    filter.talkgroupNum = {
                        $in: codeArray
                    };
                }
            }

        }
    }

    query['filter'] = filter;
    if (direction == "middle" && hasStart) {
        await get_calls(query, numResults, start, res);
    } else {
        await get_calls(query, numResults, false, res);
    }
}


exports.get_card = async function (req, res) {
    var objectId = req.params.id;
    const o_id = parseObjectId(objectId);
    if (!o_id) {
        console.warn("Error - /card/:id invalid ObjectId " + objectId);
        res.status(400).json({
            error: "Invalid id",
            "_id": objectId
        });
        return;
    }

    const item = await Call.findById(o_id).exec();

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
        console.warn("Error - /card/:id Could not find Item " + objectId);
        res.status(404).send('Sorry, we cannot find that!');
    }
}

function package_call(item) {
    var time = new Date(item.time);
    var timeString = time.toLocaleTimeString("en-US");
    var dateString = time.toDateString();
    const call = {
        _id: item._id.toHexString(),
        shortName: item.shortName,
        talkgroupNum: item.talkgroupNum,
        filename: item.path + item.name,
        url: item.url,
        time: item.time,
        timeString: timeString,
        dateString: dateString,
        patches: item.patches,
        path: item.path,
        name: item.name,
        freq: item.freq,
        srcList: item.srcList,
        star: item.star,
        emergency: item.emergency,
        len: Math.round(item.len)
    };
    return call;
}

async function change_star(req, res, amount, label) {
    var objectId = req.params.id;
    const o_id = parseObjectId(objectId);
    if (!o_id) {
        console.warn("Error - " + label + " invalid ObjectId " + objectId);
        res.status(500).json({
            success: false,
            message: "Invalid id",
            "_id": objectId
        });
        return;
    }
    const item = await Call.findOneAndUpdate({ _id: o_id }, { $inc: { star: amount } }, { new: true });
    if (!item) {
        res.status(500).json({
            success: false,
            "_id": objectId
        });
        return;
    }
    // No next(): nothing follows these routes, and calling it after responding
    // made Express's final handler destroy the keep-alive socket.
    res.send(JSON.stringify({
        success: true,
        call: package_call(item)
    }));
}

exports.remove_star = async function (req, res) {
    await change_star(req, res, -1, "/remove_star/:id");
}

exports.add_star = async function (req, res) {
    await change_star(req, res, 1, "/add_star/:id");
}


exports.get_call = async function (req, res) {
    var objectId = req.params.id;
    const o_id = parseObjectId(objectId);
    if (!o_id) {
        console.warn("[" + req.params.shortName + "] Error - /:shortName/call/:id invalid ObjectId " + objectId);
        res.status(500).json({
            success: false,
            error: "Invalid id",
            "_id": objectId
        });
        return;
    }
    const item = await Call.findById(o_id).exec();

    if (item) {
        var call = package_call(item);
        res.contentType('json');
        res.send(JSON.stringify({
            success: true,
            call: call
        })
        );

    } else {
        console.warn("[" + req.params.shortName + "] Error - /:shortName/call/:id Could not find item ID: " + objectId);
        res.status(404).json({
            success: false,
            "_id": objectId
        });
    }

}

// One handler per route; they differ only in direction, page size and where the
// time comes from.
function callsRoute(direction, numResults, timeFrom) {
    return async function (req, res) {
        const { filter_code, filter_type, starred } = readFilterQuery(req);
        const short_name = req.params.shortName.toLowerCase();
        let start_time = null;
        if (timeFrom === "query") {
            start_time = parseInt(str(req.query["time"]), 10);
        } else if (timeFrom === "param") {
            start_time = parseInt(req.params.time, 10);
        }
        await build_filter(filter_type, filter_code, start_time, direction, short_name, numResults, starred, res);
    };
}

// This is what you use when you want to get some calls before and after a timestamp.
exports.get_date_calls = callsRoute('middle', defaultNumResults, "query");
exports.get_latest_calls = callsRoute('older', 1, null);
exports.get_next_calls = callsRoute('newer', 1, "query");
exports.get_newer_calls = callsRoute('newer', defaultNumResults, "query");
exports.get_older_calls = callsRoute('older', defaultNumResults, "query");
//Delete this after I fix the iPhone app
exports.get_iphone_calls = callsRoute('older', defaultNumResults, "param");
exports.get_calls = callsRoute('older', defaultNumResults, null);
