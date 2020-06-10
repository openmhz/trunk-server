var sources = {};
var pendingSources = {};
var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
mongo.BSONPure = require('bson').BSONPure;
var BSON = mongo.BSONPure;


function getPendingSources(shortName, callback) {
    var sources = [];
    var count = 0;
    db.get().collection('pending_sources', function(err, collection) {
        collection.find({
            'shortName': shortName
        }).count(function(err, total) {
            var cursor = collection.find({
                'shortName': shortName
            });
            cursor.each(function(err, item) {

                if (item != null) {

                    var sourceColl = db.collection('source_names');

                    sourceColl.find({
                        'sourceId': item.sourceId,
                        'shortName': shortName
                    }).toArray(function(err, existingSources) {

                        var source = {
                            objectId: item._id.toHexString(),
                            sourceId: item.sourceId,
                            name: item.name,
                            codeName: item.codeName,
                            callId: item.callId,
                            time: item.time,
                            existingSources: existingSources
                        };
                        sources.push(source);
                        count++;
                        if (count == total) {
                            callback(sources);
                        }

                    });
                }
            });
        });
    });
};

function insertPendingSource(shortName, sourceItem, res) {
    db.get().collection('pending_sources', function(err, sourceNameCollection) {
        sourceNameCollection.insert(sourceItem, function(err, result) {
            if (err) {
                console.warn(err.message);
                res.status(404);
                res.send({
                    error: err
                });
                return;
            }

            getPendingSources(shortName, function(sources) {

                console.log("sending: " + util.inspect(sources));

                res.send(JSON.stringify({
                    sources: sources,
                    source: sourceItem,
                    result: result.result
                }));
            });
        });
    });
};

function updatePendingSource(shortName, sourceItem, filter, res) {
    db.get().collection('pending_sources', function(err, sourceNameCollection) {
        sourceNameCollection.updateOne(filter, sourceItem, {
            upsert: true
        }, function(err, result) {
            if (err) {
                console.warn(err.message);
                res.status(404);
                res.send({
                    error: err
                });
                return;
            }

            getPendingSources(shortName, function(sources) {
                res.send(JSON.stringify({
                    sources: sources,
                    source: sourceItem,
                    result: result.result
                }));
            });
        });
    });
};


app.post('/:shortName/pending_sources', function(req, res) {


    res.contentType('json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.body) {
        var sourceId = req.body.sourceId;
        if (!isNaN(sourceId) && (sourceId > 0)) {
            var filter = {};
            var name = req.body.name;
            var codeName = req.body.codeName;
            var call = req.body.call;
            var time = new Date();

            if (name) {
                name = name.replace(/[^\w\s]/gi, '');
            }
            if (codeName) {
                codeName = codeName.replace(/[^\w]/gi, '');
            }
            var sourceItem = {
                sourceId: sourceId,
                name: name,
                codeName: codeName,
                time: time
            };

            if (call) {
                sourceItem.call = new BSON.ObjectID(call);
            }

            if (name && codeName) {

                if (req.body.objectId) {
                    filter._id = ObjectID.createFromHexString(req.body.objectId);
                    updatePendingSource(req.params.shortName.toLowerCase(), sourceItem, filter, res);
                } else {
                    insertPendingSource(req.params.shortName.toLowerCase(), sourceItem, res);
                }
            }
        }
    }
});
