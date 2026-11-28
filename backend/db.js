var Call = require("./models/call");
var Event = require("./models/event");
var Podcast = require("./models/podcast");

exports.cleanOldEvents = async function() {
  var date = new Date();
  Event.bulkWrite([
    {
      deleteMany: {
        filter: { expireTime: {$lt: date} }
      }
    }
  ]).catch(err => {
    console.error("Cleanup failed: " + err);
    return { deletedCount: 0 };
  }).then(res => {
   // Prints "1 1 1"
   console.log("Removed " + res.deletedCount + " Events");
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
  ]).catch(err => {
    console.error("Cleanup failed: " + err);
    return { deletedCount: 0 };
  }).then(res => {
   // Prints "1 1 1"
   console.log("Removed " + res.deletedCount + " Podcasts");
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
  ]).catch(err => {
    console.error("Cleanup failed: " + err);
    return { deletedCount: 0 };
  }).then(res => {
   // Prints "1 1 1"
   console.log("Removed " + res.deletedCount + " Calls older than " + date);
  });
}