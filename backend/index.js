
var express = require("express");
var passport = require("passport");
var util = require("util");

var secrets = require("./config/secrets");
var configurePassport = require("./config/passport");
var configureExpress = require("./config/express");

var calls = require("./controllers/calls");
var uploads = require("./controllers/uploads");
var systems = require("./controllers/systems");
var talkgroups = require("./controllers/talkgroups");
var groups = require("./controllers/groups");
var stats = require("./controllers/stats");
var events = require("./controllers/events");
var config = require('./config/config.json');

var mongoose = require("mongoose");
var ObjectID = require('mongodb').ObjectID;
var db = require('./db');

var System = require("./models/system");
var Permission = require("./models/permission");
var multer = require('multer');

// -------------------------------------------
var app = express();
// -------------------------------------------

const server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

var Twitter = require('twitter-lite');


//io.origins('*:*');
/*
io.origins((origin, callback) => {
  //if (origin !== 'https://foo.example.com') {
  //  return callback('origin not allowed', false);
  //}
  callback(null, true);
});*/

io.on('connection', function (socket) {
  //console.log('a user connected');
  socket.on('disconnect', function () {
    //console.log('user disconnected');
  });
});


// This section of code enable a Twitter client to tweet out messages when a new call comes in

/*
const client = new Twitter({
  subdomain: "api", // "api" is the default (change for other subdomains)
  version: "1.1", // version "1.1" is the default (change for other subdomains)
  consumer_key: process.env.TWITTER_CONSUMER_KEY, // from Twitter.
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET, // from Twitter.
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY, // from your User (oauth_token)
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET // from your User (oauth_token_secret)
});

client
  .get("account/verify_credentials")
  .then(results => {
    console.log("Connected to Twitter");
  })
  .catch(console.error);
*/

function getRole(req) {
  if (req.params.shortName && req.user) {
    var short_name = req.params.shortName.toLowerCase();
    var userId = req.user._id;
    Permission.findOne({ 'userId': userId, 'shortName': short_name }, function (err, permission) {
      if (err) {
        console.error('Error - getRole userId: ' + userId + ' shortName: ' + short_name + ' error: ' + err);
        return -1;
      }
      console.log('Found - getRole userId: ' + userId + ' shortName: ' + short_name + ' role: ' + permission.role);

      return permission.role;
    });
  }
}

function isUser(req, res, next) {
  if (req.params.shortName) {
    var short_name = req.params.shortName.toLowerCase();
    System.findOne({ 'shortName': short_name }, function (err, system) {
      if (err) {
        console.error('Error - System not found: ' + short_name);
        res.status(505).send({
          success: false,
          message: "System Not Found"
        });
      }
      if (!system.private) return next();

      // Looks like the system is private...

      if (getRole(req) > 0) return next();
      res.status(401).send({
        success: false,
        message: "Insufficent Permission."
      });
    });
  }
}


// -------------------------------------------

configurePassport(app, passport)
configureExpress(app, passport)

// -------------------------------------------


const connect = () => {
  mongoose.connect(secrets.db, (err, res) => {
    if (err) {
      console.log(`Error connecting to ${secrets.db}. ${err}`)
    } else {
      console.log(`Successfully connected to ${secrets.db}.`)
    }
  })
}
connect()

mongoose.connection.on("error", console.error)
mongoose.connection.on("disconnected", connect)


var upload = multer({
  dest: config.uploadDirectory
});

var clients = [];

function addSystemClients(req, res, next) {
  var systemClients = {};
  for (var key in clients) {
    if (clients.hasOwnProperty(key)) {
      const client = clients[key];
      const shortName = client.shortName;
      if (client.active) {
        if (systemClients.hasOwnProperty(shortName)) {
          systemClients[shortName]++;
        } else {
          systemClients[shortName] = 1;
        }
      }
    }
  }
  req.systemClients = systemClients;
  next();
}



/*------    CALLS   ----------*/

app.get('/card/:id', calls.get_card);
app.get('/:shortName/call/:id', calls.get_call);
app.get('/:shortName/calls/latest', calls.get_latest_calls);
app.get('/:shortName/calls/next', calls.get_next_calls);
app.get('/:shortName/calls/newer', calls.get_newer_calls);
app.get('/:shortName/calls/older', calls.get_older_calls);
app.get('/:shortName/calls/:time/older', calls.get_iphone_calls);
app.get('/:shortName/calls', calls.get_calls);
app.post('/:shortName/star/:id', calls.add_star);
app.post('/:shortName/removeStar/:id', calls.remove_star);

/*------    UPLOADS   ---------- upload.single('call'),  uploads.upload,*/
app.post('/:shortName/upload', upload.single('call'), uploads.upload, async function (req, res) {
  notify_clients(req.call);

  // This section is for sending out tweets when new calls come in

  /*
  if ((req.call.shortName == "dcfd") && (req.call.talkgroupNum == 101)) {
    var call_time = new Date(req.call.time);
    var call_link = "https://openmhz.com/system/dcfd?call-id=" + req.call._id + "&time=" + call_time.getTime();

    var call_time_label = call_time.toLocaleDateString('en-US', { timeZone: "America/New_York" }) + " " + call_time.toLocaleTimeString('en-US', { timeZone: "America/New_York" })
    var status = req.call.len + " sec transmission\n" + call_time_label + "\n" + call_link;
    const response = await client.post('statuses/update', {
      status: status,
    });
    //console.log("Tweet Response: " + response);
  }*/
});

/*------    SYSTEMS   ----------*/
app.get('/systems', addSystemClients, systems.get_systems);

/*------    TALKGROUPS   ----------*/
app.get('/:shortName/talkgroups', talkgroups.get_talkgroups);

/*------    GROUPS   ----------*/
app.get('/:shortName/groups', groups.get_groups);

/*------    EVENTS   ----------*/
app.post('/events', events.addNewEvent);


/*------    STATS   ----------*/
app.get('/:shortName/errors', stats.get_errors);
app.get('/:shortName/stats', stats.get_stats);


function get_clients(req, res) {
  if (req.params.shortName) {
    var short_name = req.params.shortName.toLowerCase();
  } else {
    var short_name = null;
  }
  var total = 0;
  var response = [];
  for (var key in clients) {
    if (clients.hasOwnProperty(key)) {
      total++;
      if (!short_name || (clients[key].shortName == short_name)) {
        var age = (Date.now() - clients[key].timestamp) / 1000;
        var obj = {
          shortName: clients[key].shortName,
          filterCode: clients[key].filterCode,
          filterName: clients[key].filterName,
          filterType: clients[key].filterType,
          filterStarred: clients[key].filterStarred,
          active: clients[key].active,
          talkgroupNums: clients[key].talkgroupNums,
          timestamp: age
        }
        response.push(obj);
      }
    }
  }
  response.push({ "total": total });

  res.contentType('json');
  res.send(JSON.stringify(response));
}

/*------    CLIENTS   ----------*/
app.get('/clients', get_clients);
app.get('/:shortName/clients', get_clients);



app.use(function (err, req, res, next) {
  console.error("Caught an error");
  console.error(err.stack);
  /*
  res.status(err.status || 500);
  res.contentType('json');
  res.send(JSON.stringify({
      message: err.message,
      error: err
  }));*/
});


app.get('/:shortName/clients', get_clients);
app.get('/clients', get_clients);

function notify_clients(call) {
  call.type = "calls";
  var sent = 0;

  for (var key in clients) {
    if (clients.hasOwnProperty(key)) {
      var client = clients[key];
      if (client.active) {
        if (client.shortName == call.shortName.toLowerCase()) {
          // if client is not filtering for stars, or if the client is filtering and the call has stars
          if (!client.filterStarred || call.star) {
            if (client.filterCode == "") {
              sent++;
              client.socket.emit("new message", JSON.stringify(call));
            } else if (client.filterType == "unit") {
              var codeArray = client.filterCode.split(',');
              var success = false;
              for (var j = 0; j < codeArray.length; ++j) {
                for (var k = 0; k < call.srcList.length; k++) {
                  if (codeArray[j] == call.srcList[k]) {
                    sent++;
                    client.socket.emit("new message", JSON.stringify(call));
                    success = true;
                    break;
                  }
                }
                if (success) {
                  break;
                }
              }


            } else {
              var codeArray = client.talkgroupNums;
              for (var j = 0; j < codeArray.length; ++j) {
                if (codeArray[j] == call.talkgroupNum) {
                  client.socket.emit("new message", JSON.stringify(call));
                  sent++
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  if (sent > 0) {
    //console.log("[" + call.shortName.toLowerCase() + "] Sent call to " + sent + " clients");
  }
}







io.sockets.on('connection', function (client) {
  clients[client.id] = { socket: client, active: false };
  clients[client.id].timestamp = new Date();
  client.on('start', function (data) {
    if (clients[client.id] && data.shortName) {
      clients[client.id].active = true;
      clients[client.id].shortName = data.shortName.toLowerCase();
      clients[client.id].filterCode = String(data.filterCode);
      clients[client.id].filterName = data.filterName;
      clients[client.id].filterStarred = data.filterStarred;
      clients[client.id].filterType = String(data.filterType);
      clients[client.id].talkgroupNums = [];
      clients[client.id].timestamp = new Date();
      if ((data.filterType == "group") && (data.filterCode.indexOf(',') == -1)) {
        db.get().collection("groups", function (err, groupCollection) {
          if (err || !groupCollection) {
            console.error("Error - unable to open groups collection: " + err);
            delete clients[client.id];
            return;
          }
          if (!ObjectID.isValid(data.filterCode)) {
            console.error("Error - Socket - Invalid Group ID: " + data.filterCode);
            delete clients[client.id];
            return;
          }
          groupCollection.findOne({
            'shortName': data.shortName.toLowerCase(),
            '_id': ObjectID.createFromHexString(data.filterCode)
          }, function (err, group) {
            if (err) {
              console.warn("[" + data.shortName.toLowerCase() + "] Error - WebSocket Group ID not Found! Error: " + err + " Group ID: " + data.filterCode);
              delete clients[client.id];
              return;
            } else {
              if (group && clients[client.id]) {
                clients[client.id].talkgroupNums = group.talkgroups;
              } else {
                console.error("Error - Socket: Invalid group or Client: " + data.filterCode + " Shortname: " + data.shortName + " ClientID: " + client.id);
                delete clients[client.id];
                return;
              }
            }
          });
        });

      } if ((data.filterType == "talkgroup") && Array.isArray(data.filterCode)) {
        clients[client.id].talkgroupNums = data.filterCode;
      }
      //console.log("[" + data.shortName.toLowerCase() + "] WebSocket Updating - Client: " + client.id + " code set to: " + data.filterCode + " type set to: " + data.filterType + " TGS: " + clients[client.id].talkgroupNums);
    } else {
      console.error("Error - Socket.io [Start] either client not found or no Short Name");
    }
  });
  client.on('stop', function (data) {
    if (clients[client.id]) {
      clients[client.id].active = false;
    } else {
      console.error("Error - Socket.io [Stop] either client not found ");
    }
  });
  client.on('disconnect', function () {
    delete clients[client.id];
  });
});


//console.log("stats: " + util.inspect(call_stats));
// Connect to Mongo on start
db.connect(function (err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  } else {
    stats.init_stats();

    server.listen(app.get("port"), (err) => {
      if (err) {
        console.err(err.stack)
      } else {
        console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
      }
    })


  }
})

/*
var calcRule = new schedule.RecurrenceRule();
calcRule.minute = 4;

var calcSched = schedule.scheduleJob(calcRule, function() {
    console.log('Time to calulcate stats');
    call_stats.build_call_volume();
    console.log('Time to calulcate usage');
    call_stats.build_usage();
});
*/





module.exports = app;
