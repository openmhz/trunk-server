db = db.getMongo().getDB( "scanner" );
var start = new Date();
start.setHours(start.getHours() - 1);
var results = db.calls.aggregate([{
            $match: {
                time: {
                    $gte: start
                },
                shortName: 'dcfd'
            }
        },

        {
            "$unwind": "$freqList"
        },
        {
            "$project": {
                "freqList": 1,
                "errorRatio": {
                    $cond: [{
                        $eq: ["$freqList.len", 0]
                    }, 0, {
                        "$multiply": [{
                            "$divide": ["$freqList.errors", "$freqList.len"]
                        }, 100]
                    }]
                },
                "time": "$time"
            }
        },
        {
            "$group": {
                "_id": "$freqList.freq",
                "values": {
                    "$push": {
                        "time": "$time",
                        "errors": "$errorRatio",
                        "spikes": "$freqList.spikes"
                    }
                }
            }
        },
        {
            $sort: {
                _id: -1
            }
        }]);

        results.forEach(function(document)  {
                printjson(document);
            });
