var call_stats = require('./call_stats');
var db = require('./db');

db.connect(function(err) {
    if (err) {
        console.log('Unable to connect to Mongo.')
        process.exit(1)
    } else {
      //call_stats.build_usage();
      //call_stats.build_call_volume();
      call_stats.test2();

    }
})
