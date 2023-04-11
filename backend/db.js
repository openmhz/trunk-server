var MongoClient = require('mongodb').MongoClient;


var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

var state = {
  db: null,
}

exports.connect = async function (done) {
  if (state.db) return done()

  var url = 'mongodb://' + host + ':' + port + '/scanner';

  const client = new MongoClient(url);
  await client.connect();
  state.db = client.db();
  done();
}

exports.get = function () {
  return state.db
}

exports.close = function (done) {
  if (state.db) {
    state.db.close(function (err, result) {
      state.db = null
      state.mode = null
      done(err)
    })
  }
}