var fs = require('fs');
var path = require('path');
var config = require('./config/config.json');
var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
mongo.BSONPure = require('bson').BSONPure;
var BSON = mongo.BSONPure;
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var db = require('./db');
var util = require("util"),
    rl = require('readline'),
    spawn = require('child_process').spawn;



function build_call_stats(results) {
    var historic = new Array();


    // go through all of the results
    if (results && (results.length > 0)) {
        for (var i = 0; i < results.length; i++) {
            // if this is the first time we have seen this shortName in the results, create and array for it in the Historic array
            if (historic[results[i]._id.shortName] == undefined) {
                historic[results[i]._id.shortName] = new Array();
                for (j = 0; j < 121; j++) {
                    historic[results[i]._id.shortName][j] = 0;
                }
            }
            // add the number of calls for this system at this hour
            historic[results[i]._id.shortName][parseInt(results[i]._id.hour)] = results[i].calls;

        }

        db.get().collection('systems', function(err, sysCollection) {
            var cursor = sysCollection.find();
            cursor.each(function(err, item) {

                // go through all the systems
                if (item) {
                    // if a system has had no calls, create a blank history array
                    if (historic[item.shortName] == undefined) {
                        historic[item.shortName] = new Array();
                        for (j = 0; j < 121; j++) {
                            historic[item.shortName][j] = 0;
                        }
                    }
                } else {
                  // when item == null that means that we have gone through all the systems...
                  // time to save it.
                  for (var shortName in historic) {
                      if (historic.hasOwnProperty(shortName)) {
                          // do stuff
                          if (historic[shortName][0]>0) {
                            var active = true;
                          } else {
                            var active = false;
                          }

                          sysCollection.update({
                              shortName: shortName
                          }, {
                              $set: {
                                  "active": active
                              }
                          }, {
                              upsert: true
                          }, function(err, objects) {
                              if (err) console.warn(err.message);

                          });
                          db.get().collection('system_stats', function(err, statsCollection) {
                              if (err) console.log(err);
                              //console.log();
                              statsCollection.update({
                                  shortName: shortName
                              }, {
                                  $set: {
                                      "callHistory": historic[shortName]
                                  }
                              }, {
                                  upsert: true
                              }, function(err, objects) {
                                  if (err) console.warn(err.message);
                                  //console.log(util.inspect(objects));
                              });
                          });
                      }
                  }
                }
            });
        });
        //db.get().close();
    }
}

function build_test_stat(results) {
  var historic = new Array();


  // go through all of the results
  if (results && (results.length > 0)) {
      for (var i = 0; i < results.length; i++) {
          // if this is the first time we have seen this shortName in the results, create and array for it in the Historic array
          if (historic[results[i]._id.shortName] == undefined){
              historic[results[i]._id.shortName] = {};
            }
          if (historic[results[i]._id.shortName][results[i]._id.talkgroupNum] == undefined) {
              historic[results[i]._id.shortName][results[i]._id.talkgroupNum] = new Array();
              for (j = 0; j < 24; j++) {
                  historic[results[i]._id.shortName][results[i]._id.talkgroupNum][j] = 0;
              }
          }
          // add the number of calls for this system at this hour
          if (parseInt(results[i]._id.hour) < 24)
          historic[results[i]._id.shortName][results[i]._id.talkgroupNum][parseInt(results[i]._id.hour)] = results[i].value.count;

      }
    }
    console.log(util.inspect(results));
    /*
    var chan_count = 0;
    stats = {};
    var db_count = 0;
    for (var chan_num in channels) {
        var historic = new Array();
        chan_count++;

        for (hour = 0; hour < 24; hour++) {

            historic[hour] = 0;
        }
        stats[chan_num] = {
            name: channels[chan_num].alpha,
            desc: channels[chan_num].desc,
            num: chan_num,
            historic: historic
        };
        var query = {
            "_id.talkgroup": parseInt(chan_num)
        };
        collection.find(query).toArray(function (err, results) {
            db_count++;
            if (err) console.log(err);
            if (results && (results.length > 0)) {
                for (var i = 0; i < results.length; i++) {
                    stats[results[0]._id.talkgroup].historic[results[i]._id.hour] = results[i].value.count;
                }
            }
            if (chan_count == db_count) {
                for (var chan_num in stats) {
                    var chan = stats[chan_num];
                    var erase_me = true;
                    for (var i = 0; i < chan.historic.length; i++) {
                        if (chan.historic[i] != 0) {
                            erase_me = false;
                            break;
                        }
                    }
                    if (erase_me) {
                        delete stats[chan_num];
                    }
                }

            }
        });

    }*/
}
exports.test2 = function() {

    map = function () {
        var now = new Date();
        var difference = now.getTime() - this.time.getTime();
        var hour = Math.floor(difference / 1000 / 60 / 60);
        emit({
            hour: hour,
            talkgroupNum: this.talkgroupNum,
            shortName: this.shortName
        }, {
            count: 1
        });
    }

    reduce = function (key, values) {
        var count = 0;

        values.forEach(function (v) {
            count += v['count'];
        });

        return {
            count: count
        };
    }
    db.get().collection('calls', function (err, transCollection) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        transCollection.mapReduce(map, reduce, {
            query: {
              time: {
                  $gte: yesterday
              }
            },
             out : { inline: 1 },
        }, function (err, results) {
            if (err) console.error(err);
            build_test_stat(results);
            //console.log(util.inspect(results));
        });
    });
}
exports.test = function() {
  var collection = db.get().collection("calls");
  var now = new Date();
  var start = new Date();
  start.setDate(start.getDate() - 50);
  collection.aggregate([
     {
        $project: {
            shortName: 1,
            talkgroupNum: 1,
            ago: {
                $floor: {
                    $divide: [{
                        $subtract: [now, "$time"]
                    }, 1000 * 60]
                }
            },
            "interval": {
                "$subtract": [
                    { "$minute": "$time" },
                    { "$mod": [{ "$minute": "$time"}, 15] }
                ]
            }
        }
    }, {
     "$group": {
        "_id": {
            shortName: "$shortName",
            talkgroupNum: "$talkgroupNum",
            ago: "$ago",
            "interval": "$interval"
        },
        count: {$sum: 1}
      }
    },
    {$sort:{_id:-1}}
], function(err, results) {
    if (err) console.error("ERror" + err);

        console.log(util.inspect(results));


});
}
exports.build_tg_volume = function() {
        var collection = db.get().collection("calls");
        var now = new Date();
        var start = new Date();
        start.setDate(start.getDate() - 50);
        collection.aggregate([{
            $match: {
                time: {
                    $gte: start
                }
            }
        }, {
            $project: {
                shortName: 1,
                hour: {
                    $floor: {
                        $divide: [{
                            $subtract: [now, "$time"]
                        }, 1000 * 60 * 60]
                    }
                }
            }
        }, {
            $group: {
                _id: {
                    shortName: "$shortName",
                    hour: "$hour"
                },
                calls: {
                    $sum: 1
                }
            }
        }], function(err, results) {
            if (err) console.error("ERror" + err);
            if (results) {
                console.log("Building stats...");
                console.log(util.inspect(results));
                build_call_stats(results);
            }


        });
    }
exports.build_call_volume = function() {
        var collection = db.get().collection("calls");
        var now = new Date();
        var start = new Date();
        start.setDate(start.getDate() - 5);
        collection.aggregate([{
            $match: {
                time: {
                    $gte: start
                }
            }
        }, {
            $project: {
                shortName: 1,
                hour: {
                    $floor: {
                        $divide: [{
                            $subtract: [now, "$time"]
                        }, 1000 * 60 * 60]
                    }
                }
            }
        }, {
            $group: {
                _id: {
                    shortName: "$shortName",
                    hour: "$hour"
                },
                calls: {
                    $sum: 1
                }
            }
        }], function(err, results) {
            if (err) console.error("ERror" + err);
            if (results) {
                console.log("Building stats...");
                console.log(util.inspect(results));
                build_call_stats(results);
            }


        });
    }
    /*
    exports.build_call_volume = function() {

        map = function() {
            var now = new Date();
            var difference = now.getTime() - this.time.getTime();
            var hour = Math.floor(difference / 1000 / 60 / 60);
            emit({
                hour: hour,
                shortName: this.shortName
            }, {
                count: 1
            });
        }

        reduce = function(key, values) {
            var count = 0;

            values.forEach(function(v) {
                count += v['count'];
            });
            printjson(count);
            return {
                count: count
            };
        }
        db.get().collection('calls', function(err, callsCollection) {
            var start = new Date();
            start.setDate(start.getDate() - 5);
            callsCollection.mapReduce(map, reduce, {
                query: {
                    time: {
                        $gte: start
                    }
                },
                out: {
                    replace: "call_volume"
                }
            }, function(err, collection) {
                if (err) console.error("ERror" + err);
                if (collection) {
                    console.log("Building stats...");
                    build_call_stats(collection);
                }
            });
        });
    };
    */

exports.build_usage = function() {
    var base_path = config.mediaDirectory;
    var total = 0;
    var sysCount = 0;
    db.get().collection('systems', function(err, sysCollection) {
        var cursor = sysCollection.find();
        cursor.each(function(err, item) {
            if (item) {

                var local_path = config.mediaDirectory + "/" + item.shortName + "/";
                console.log("System: " + item.shortName + " [ " + local_path + " ]");

                var du = spawn('du', ['-s', local_path]);
                //var ls = spawn('ls', ['-lh', '/usr']);

                //linereader = rl.createInterface(du.stdout, du.stdin);

                // Read line by line.
                //du.stdout.on('data', function (data) {

                du.stderr.on('data', (data) => {
                    console.log(`stderr: ${data}`);
                });

                du.on('close', (code) => {
                    //console.log(`child process exited with code ${code}`);
                });
                /*
                                ls.stdout.on('data', (data) => {
                                  console.log(data);
                                    console.log(`stdout: ${data}`);
                                  });
                                  */
                du.stdout.on('data', function(data) {
                    var out = String(data);
                    var arr = out.split('\t');
                    var size = parseInt(arr[0]);
                    console.log(out + " Size: " + size);




                    db.get().collection('system_stats', function(err, statsCollection) {


                        statsCollection.update({
                            shortName: item.shortName

                        }, {
                            $set: {
                                "usageBytes": size,
                                "usageMb": (size / 1024)
                            }
                        }, {
                            upsert: true
                        }, function(err, objects) {
                            if (err) console.warn(err.message);

                        });
                    });

                });
            } else {
                console.log("Processed: " + sysCount);

            }

        });
    });

};
