db = db.getMongo().getDB( "scanner" );

var bulkRemove = db.calls.initializeUnorderedBulkOp()
var short_date = new Date();

db.systems.find().forEach(
  function(system){
    var date = new Date();
    var total =0;
    if (system.planType == 10){
      date.setMonth(date.getDate() - 30);

    }  else {
      date.setDate(date.getDate() - 7);
    }
      print(system.shortName);

      bulkRemove.find({"time":{$lt: date}, "shortName": system.shortName}).remove();


});

//bulkInsert.execute()
var results = bulkRemove.execute();
print("Removed: " + results.nRemoved);
