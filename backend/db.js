var Call = require("./models/call");

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