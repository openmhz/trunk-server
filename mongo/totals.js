db = db.getMongo().getDB( "scanner" );
var results = db.calls.aggregate(
  [ {
    $project: {
      len: true,
      year: {$year: "$time"},
      month: {$month: "$time"},
      dayOfMonth: {$dayOfMonth: "$time"}
    }
  },
     {
       $group:
         {
           _id: {
            year: '$year',
            month: '$month',
            dayOfMonth: '$dayOfMonth'
          },
           totalAudio: { $sum: "$len" },
           count: { $sum: 1 }
         }
     }
   ]
)

results.forEach(function(document)  {
        printjson(document);
    });
