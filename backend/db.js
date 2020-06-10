var MongoClient = require('mongodb').MongoClient;
var config = require('./config/config.json');
var test = require('assert');

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;
var dbUser = process.env['MONGO_TRUNK_FRONTEND_USER'] != null ? process.env['MONGO_TRUNK_FRONTEND_USER'] : null;
var dbPass = process.env['MONGO_TRUNK_FRONTEND_PASS'] != null ? process.env['MONGO_TRUNK_FRONTEND_PASS'] : null;

var state = {
  db: null,
}

exports.connect = function(done) {
  if (state.db) return done()

  var url = 'mongodb://' + host + ':' + port + '/scanner';

  MongoClient.connect(url, function(err, db) {
    if (err) return done(err)
    if (dbUser) {
    db.authenticate(dbUser, dbPass, function (err, result) {
        //test.equal(true, result);
        state.db = db;
        done();
    });
  } else {
    state.db = db;
    done();
  }
  })
}

exports.get = function() {
  return state.db
}

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null
      state.mode = null
      done(err)
    })
  }
}