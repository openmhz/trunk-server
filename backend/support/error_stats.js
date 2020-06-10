var fs = require('fs');
var path = require('path');
var config = require('./config/config.json');
var csvWriter = require('csv-write-stream');

var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
mongo.BSONPure = require('bson').BSONPure;
var BSON = mongo.BSONPure;
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var db = require('./db');
var getSize = require('get-folder-size');
var util = require("util"),
    rl = require('readline'),
    spawn = require('child_process').spawn;

exports.test = function() {


    map = function() {

        for (var idx = 0; idx < this.freqList.length; idx++) {
            var key = this.freqList[idx].freq;
            if (this.freqList[idx].errors >= 0) {
                if (this.freqList[idx].len > 0) {
                    var errRatio = Math.round((this.freqList[idx].errors / this.freqList[idx].len) * 100 * 1e2) / 1e2 ;
                } else {
                    var errRatio = 0;
                }
                var value = {

                    "spikes": this.freqList[idx].spikes,
                    "errRatio": errRatio
                };
                emit(key, value);
            }
        }

    }


    reduce = function(key, values) {
        var spikes = new Array();
        var errors = new Array();
        printjson(key);
        printjson(values);
        values.forEach(function(v) {
            spikes.push(v['spikes']);
            errors.push(v['errRatio']);
        });
        return {
            "spikes": spikes,
            "errors": errors
        };
    }
    db.get().collection('calls', function(err, transCollection) {

        transCollection.mapReduce(map, reduce, {
            query: {
                "shortName": "tester"
            },
            out: {
                inline: 1
            },
        }, function(err, results) {
            if (err) {
                console.error(err);
            } else {

                for (var freq in results) {
                    if (results[freq].value.spikes) {
                        writer.pipe(fs.createWriteStream(results[freq]._id + '.csv'));

                        for (var idx = 0; idx < results[freq].value.spikes.length; idx++) {
                            writer.write({
                                "spikes": results[freq].value.spikes[idx],
                                "errors": results[freq].value.errors[idx]
                            });
                        }
                    }
                    /*results[freq].forEach(function(err){
                      writer.write(err)
                    });*/

                    console.log("Freq: " + freq + "\n" + util.inspect(results[freq]));
                }
                writer.end();
            }



        });
    });
}

db.connect(function(err) {
    if (err) {
        console.log('Unable to connect to Mongo.')
        process.exit(1)
    } else {
        //call_stats.build_usage();
        //call_stats.build_call_volume();
        //exports.test();
        var start = new Date();
        start.setHours(start.getHours() - 1);
        var collection = db.get().collection("calls");
        collection.aggregate([
          {
              $match: {
                  time: {
                      $gte: start
                  },
                  shortName: "wmata"
              }
          },

           { "$unwind": "$freqList"
          },
          { "$project": {
            "freqList":1,
            "errorRatio": { $cond: [ { $eq: [ "$freqList.len", 0 ] }, 0, {"$multiply": [ {"$divide": ["$freqList.errors", "$freqList.len"]}, 100]} ] },
            "time": { $dateToString: { format: "%H:%M:%S", date: "$time" } }
          }},
          {
           "$group": {
              "_id": {
                  freq: "$freqList.freq"
              },

          "time": { $push: "$time"},
           "errors": { $push:  "$errorRatio"},
           "spikes": { $push: "$freqList.spikes"}
            }
          },
          {$sort:{_id:-1}}
      ], function(err, results) {
          if (err) console.error("ERror" + err);


          for (var freq in results) {
              if (results[freq].errors) {
                  var writer = csvWriter();
                  writer.pipe(fs.createWriteStream(results[freq]._id.freq + '.csv'));

                  for (var idx = 0; idx < results[freq].spikes.length; idx++) {
                      writer.write({
                          "time": results[freq].time[idx],
                          "spikes": results[freq].spikes[idx],
                          "errors": results[freq].errors[idx]
                      });
                  }
                  writer.end();
                  console.log("Freq: " + freq + "\n" + util.inspect(results[freq]));
              }



          }

      });

    }
})
