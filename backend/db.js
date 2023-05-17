const { CloudWatchLogs } = require("aws-sdk");
var { callModel: Call } = require("./models/call");
var Event = require("./models/event");
var Podcast = require("../models/podcast");

exports.cleanOldEvents = async function() {
  var date = new Date();
  Event.bulkWrite([
    {
      deleteMany: {
        filter: { expireTime: {$lt: date} }
      }
    }
  ]).then(res => {
   // Prints "1 1 1"
   console.log("Removed " + res.deletedCount + " Podcasts");
  });
}

exports.cleanOldPodcasts = async function() {
  var date = new Date();
  Podcast.bulkWrite([
    {
      deleteMany: {
        filter: { expireTime: {$lt: date} }
      }
    }
  ]).then(res => {
   // Prints "1 1 1"
   console.log("Removed " + res.deletedCount + " Events");
  });
}



exports.cleanOldCalls = async function() {
  var date = new Date();
  date.setMonth(date.getMonth() - 1);
  Call.bulkWrite([
    {
      deleteMany: {
        filter: { time: {$lt: date} }
      }
    }
  ]).then(res => {
   // Prints "1 1 1"
   console.log("Removed " + res.deletedCount + " Calls older than " + date);
  });
}