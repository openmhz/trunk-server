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
var findRemoveSync = require('./find-remove');
var util = require('util');


function sweep(){
  var base_path = config.mediaDirectory;
  var total = 0;
  var sysCount = 0;
  db.get().collection('systems', function(err, sysCollection) {
    var cursor = sysCollection.find();
    cursor.each(function(err, item) {
        if (item) {
          var date = new Date();
          var old;
          if (item.shortName == "dcfd"){
            old = 60*60*24*30;
            date.setMonth(date.getMonth() - 1);

          }  else {
            old = 60*60*24*5;
            date.setDate(date.getDate() - 5);
          }
        var local_path = config.mediaDirectory + "/" + item.shortName + "/";
        console.log("Sytems: " + local_path + " Date: " + date + " Seconds: " + old);
        try {
        var result = findRemoveSync(local_path, { age: {seconds: old}, removeEmpty:true, files: "*.*"});
        if (result && result.totals) {
          result.totals.date = date;
        } else {
          result = {totals:{fileSize: 0, deletedSize:0, files: 0, deleted:0, date: date}};
        }
        db.get().collection('system_stats', function(err, statsCollection) {
          statsCollection.update({
              shortName: item.shortName
          }, {
              $set: {
                  "sweep": result.totals
              }
          }, {
              upsert: true
          }, function(err, objects) {
              if (err) console.warn("Problem adding system stats: " + err.message);
          });
        });

      } catch (e) {
        console.log("Error trying to remove: ");
        console.log(e);
      }
        console.log("Deleted: \n");
        console.log(util.inspect(result));
        sysCount++;
      } else {
        console.log("Clean Sweep - Systems Processed: " + sysCount);
        db.get().close();
      }

    });
  });

}
// Connect to Mongo on start
db.connect(function(err) {
    if (err) {
        console.log('Unable to connect to Mongo.')
        process.exit(1)
    } else {

      sweep();
    }
})
