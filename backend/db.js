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



// One delete per system so each uses the { shortName, time } index. A single
// deleteMany on time alone scanned the whole collection every night (64M
// documents, about 6 minutes, in the last profile). Same logic as
// `mongo/db.sh clean-calls`.
exports.cleanOldCalls = async function() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const started = Date.now();
  let removed = 0;
  try {
    const shortNames = await Call.distinct("shortName");
    for (const shortName of shortNames) {
      try {
        const res = await Call.deleteMany({ shortName: shortName, time: { $lt: date } });
        removed += res.deletedCount;
      } catch (err) {
        console.error("Cleanup failed for " + shortName + ": " + err);
      }
    }
  } catch (err) {
    console.error("Cleanup failed: " + err);
  }
  console.log("Removed " + removed + " Calls older than " + date + " in " + Math.round((Date.now() - started) / 1000) + "s");
}