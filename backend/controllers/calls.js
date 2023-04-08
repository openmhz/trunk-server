
var ObjectID = require('mongodb').ObjectID;
var db = require('../db');
var mongoose = require("mongoose");
var { callModel: Call } = require("../models/call");
var Star = require("../models/star");

var defaultNumResults = 50;


var channels = {};


async function get_calls(query, numResults, res) {

    var calls = [];
    var fields = {
        _id: true,
        talkgroupNum: true,
        path: true,
        name: true,
        time: true,
        srcList: true,
        freq: true,
        star: true,
        len: true,
        url: true
    };

    const transCollection = db.get().collection('calls');
    const sort = { length: -1 };
    try {
        let cursor = transCollection.find(query.filter, fields).sort(sort).limit(numResults);
        await cursor.forEach(function (item) {

            call = {
                _id: item._id.toHexString(),
                talkgroupNum: item.talkgroupNum,
                url: item.url,
                filename: item.path + item.name,
                time: item.time,
                srcList: item.srcList,
                star: item.star,
                freq: item.freq,
                len: Math.round(item.len)
            };
            calls.push(call);

        });

        res.contentType('json');
        res.send(JSON.stringify({
            calls: calls,
            direction: query.direction
        }));
    } catch (err) {
        console.warn("Error - get_calls() Could not find item " + err + " filter: " + query.filter);
        res.send(404, 'Sorry, we cannot find that!');
        return;
    };
}

async function build_filter(filter_type, code, start_time, direction, shortName, numResults, starred, res) {
    var filter = {};
    var query = {};
    var FilterType = {
        All: 0,
        Talkgroup: 1,
        Group: 2,
        Unit: 3
    };


    if (start_time) {
        var start = new Date(start_time);
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
    /*
    filter.len = {
        $gte: -1.0
    };*/


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
            const groupCollection = db.get().collection("groups");


            const group = await groupCollection.findOne({
                'shortName': shortName,
                '_id': ObjectID.createFromHexString(code)
            });
            if (!group) {
                console.warn("[" + shortName + "] Error - build_filter() group is null " + err);
                res.contentType('json');
                res.status(404);
                res.send(JSON.stringify({
                    message: 'That Group ID doesnt exist.'
                }));
            }
            filter.talkgroupNum = {
                $in: group.talkgroups
            };
            query['filter'] = filter;

            get_calls(query, numResults, res);

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

            if (filter_type == "unit") {
                if (code) {
                    var codeArray = code.split(',').map(function (item) {
                        return parseInt(item, 10);
                    });
                    filter.srcListv = {
                        $in: codeArray
                    };
                }
            }
            query['filter'] = filter;

            get_calls(query, numResults, res);
        }
    } else {
        query['filter'] = filter;
        get_calls(query, numResults, res);
    }
}


exports.get_card = async function (req, res) {
    var objectId = req.params.id;
    try {
        var o_id = ObjectID.createFromHexString(objectId);
    } catch (err) {
        console.warn("Error - /card/:id generating ObjectID " + err);
        res.status(500);
        res.send(JSON.stringify({
            error: err,
            "_id": objectId
        }));
        return;
    }
    const transCollection = db.get().collection('calls');
    const item = await transCollection.findOne({ '_id': o_id });

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

function package_call(item) {
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
        star: item.star,
        len: Math.round(item.len)
    };
    return call;
}

exports.remove_star = async function (req, res, next) {
    var objectId = req.params.id;
    try {
        var o_id = ObjectID.createFromHexString(objectId);
    } catch (err) {
        console.warn("[" + req.params.shortName + "] Error - /remove_star/:id generating ObjectID " + err);
        res.status(500);
        res.send(JSON.stringify({
            success: false,
            message: err,
            "_id": objectId
        }));
        return;
    }
    const item = await Call.findOneAndUpdate({ _id: objectId }, { $inc: { star: -1 } }, { new: true });
    if (!item) {
        res.status(500);
        res.send(JSON.stringify({
            success: false,
            "_id": objectId
        }));
    } else {
        var call = package_call(item);
        req.call = call;
        res.send(JSON.stringify({
            success: true,
            call: call
        }));
        next();
    }
}


exports.add_star = async function (req, res, next) {
    var objectId = req.params.id;
    try {
        var o_id = ObjectID.createFromHexString(objectId);
    } catch (err) {
        console.warn("[" + req.params.shortName + "] Error - /add_star/:id generating ObjectID " + err);
        res.status(500);
        res.send(JSON.stringify({
            success: false,
            message: err,
            "_id": objectId
        }));
        return;
    }
    const item = await Call.findOneAndUpdate({ _id: objectId }, { $inc: { star: 1 } }, { new: true });
    if (!item) {
        res.status(500);
        res.send(JSON.stringify({
            success: false,
            "_id": objectId
        }));
    } else {
        var call = package_call(item);
        req.call = call;
        res.send(JSON.stringify({
            success: true,
            call: call
        }));
        next();
    }

}


exports.get_call = async function (req, res) {
    var objectId = req.params.id;
    try {
        var o_id = ObjectID.createFromHexString(objectId);
    } catch (err) {
        console.warn("[" + req.params.shortName + "] Error - /:shortName/call/:id generating ObjectID " + err);
        res.status(500);
        res.send(JSON.stringify({
            success: false,
            error: err,
            "_id": objectId
        }));
        return;
    }
    const transCollection = db.get().collection('calls');
    const item = await transCollection.findOne({ '_id': o_id });

    if (item) {
        var call = package_call(item);
        res.contentType('json');
        res.send(JSON.stringify({
            success: true,
            call: call
        })
        );

    } else {
        console.warn("[" + req.params.shortName + "] Error - /:shortName/call/:id Could not find item " + err + " ID: " + objectId);
        res.status(404);
        res.send(JSON.stringify({
            success: false,
            "_id": objectId
        }));
    }

}


exports.get_latest_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var short_name = req.params.shortName.toLowerCase();
    //console.log("[" + short_name + "] Latest -  Call Get Filter code: " + filter_code + " Filter Type: " + filter_type );

    build_filter(filter_type, filter_code, null, 'older', short_name, 1, starred, res);
}


exports.get_next_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.query["time"]);
    var short_name = req.params.shortName.toLowerCase();
    //console.log("[" + short_name + "] Next Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, start_time, 'newer', short_name, 1, starred, res);
}

exports.get_newer_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.query["time"]);
    var short_name = req.params.shortName.toLowerCase();
    //console.log("[" + short_name + "] Newer Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type );

    build_filter(filter_type, filter_code, start_time, 'newer', short_name, defaultNumResults, starred, res);
}

exports.get_older_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.query["time"]);
    var short_name = req.params.shortName.toLowerCase();
    //console.log("[" + short_name + "] Older Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, start_time, 'older', short_name, defaultNumResults, starred, res);
}


//Delete this after I fix the iPhone app
exports.get_iphone_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var start_time = parseInt(req.params.time);
    var short_name = req.params.shortName.toLowerCase();
    //console.log("[" + short_name + "] iPhone Newer Calls - time: " + start_time + " Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, start_time, 'older', short_name, defaultNumResults, starred, res);
}

exports.get_calls = function (req, res) {
    var filter_code = req.query["filter-code"];
    var filter_type = req.query["filter-type"];
    var starred = req.query["filter-starred"] === 'true' ? true : false;
    var short_name = req.params.shortName.toLowerCase();
    //console.log("[" + short_name + "] Inital Calls -  Call Get Filter code: " + filter_code + " Filter Type: " + filter_type);

    build_filter(filter_type, filter_code, null, 'older', short_name, defaultNumResults, starred, res);
}
