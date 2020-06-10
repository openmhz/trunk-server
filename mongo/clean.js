db = db.getMongo().getDB( "scanner" );

var bulkRemove = db.calls.initializeUnorderedBulkOp()

    var date = new Date();
      date.setMonth(date.getMonth() - 1);

      bulkRemove.find({"time":{$lt: date}}).remove();

var results = bulkRemove.execute();
print("Removed: " + results.nRemoved);
