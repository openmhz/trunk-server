
var express = require("express");
var configureExpress = require("./config/express");

var calls = require("./controllers/calls");
var uploads = require("./controllers/uploads");
var systems = require("./controllers/systems");
var talkgroups = require("./controllers/talkgroups");
var groups = require("./controllers/groups");
var stats = require("./controllers/stats");
var events = require("./controllers/events");
var config = require('./config/config.json');
let db = require('./db')
var schedule = require('node-schedule');
var mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const Group = require("./models/group");

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




// -------------------------------------------


configureExpress(app)

// -------------------------------------------

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'mongo';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;
var mongoUrl = 'mongodb://' + host + ':' + port + '/scanner';


const connect = async () => {
    // Demonstrate the readyState and on event emitters
    console.log(mongoose.connection.readyState); //logs 0
    mongoose.connection.on('connecting', () => {
      console.log('Mongoose is connecting')
    });
    mongoose.connection.on('connected', () => {
      console.log('Mongoose is connected');
    });
    mongoose.connection.on('disconnecting', () => {
      console.log('Mongoose is disconnecting');
    });
  
    await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("All Done");
}
connect();

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
app.post('/add_star/:id', calls.add_star);
app.post('/remove_star/:id', calls.remove_star);
app.get('/:shortName/call/:id', calls.get_call);
app.get('/:shortName/calls/latest', calls.get_latest_calls);
app.get('/:shortName/calls/next', calls.get_next_calls);
app.get('/:shortName/calls/newer', calls.get_newer_calls);
app.get('/:shortName/calls/older', calls.get_older_calls);
app.get('/:shortName/calls/:time/older', calls.get_iphone_calls);
app.get('/:shortName/calls', calls.get_calls); 


/*------    UPLOADS   ---------- upload.single('call'),  uploads.upload,*/
app.post('/:shortName/upload', upload.single('call'), uploads.upload, async function (req, res) {
  notify_clients(req.call);
});

/*------    SYSTEMS   ----------*/
app.get('/systems', addSystemClients, systems.get_systems);
app.post('/:shortName/contact', systems.contact_system);

/*------    TALKGROUPS   ----------*/
app.get('/:shortName/talkgroups', talkgroups.get_talkgroups);

/*------    GROUPS   ----------*/
app.get('/:shortName/groups', groups.get_groups);


/*------    EVENTS   ----------*/
app.post('/events', events.addNewEvent);
app.get('/events', events.getEvents);
app.get('/events/:id', events.getEvent);

/*------    STATS   ----------*/
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
  client.on('start', async function (data) {
    if ((typeof clients[client.id] !== "undefined") && data.shortName) {
      clients[client.id].active = true;
      clients[client.id].shortName = data.shortName.toLowerCase();
      clients[client.id].filterCode = String(data.filterCode);
      clients[client.id].filterName = data.filterName;
      clients[client.id].filterStarred = data.filterStarred;
      clients[client.id].filterType = String(data.filterType);
      clients[client.id].talkgroupNums = [];
      clients[client.id].timestamp = new Date();

      if (typeof clients[client.id].filterCode != "string") {
        console.error("Error - Socket - Invalid filterCode: " + data.filterCode + " ShortName: " + data.shortName.toLowerCase());
        delete clients[client.id];
        return;
      }

      if ((data.filterType == "group") && (data.filterCode.indexOf(',') == -1)) {
        if (!ObjectId.isValid(data.filterCode)) {
          console.error("Error - Socket - Invalid Group ID: " + data.filterCode);
          delete clients[client.id];
          return;
        }

        const group = await Group.findOne({ 'shortName': data.shortName.toLowerCase(), '_id': ObjectId.createFromHexString(data.filterCode) });

        if (typeof clients[client.id] === "undefined") {
          console.error("How can it be undefined here!!");
          console.error(clients[client.id]);
          return;
        }
        if (group) {
          clients[client.id].talkgroupNums = group.talkgroups;
        } else {
          console.error("Error - Socket: Invalid group " + data.filterCode + " Shortname: " + data.shortName + " ClientID: " + client.id);
          delete clients[client.id];
          return;
        }

      } else if ((data.filterType == "talkgroup") && Array.isArray(data.filterCode)) {
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
      console.error("Error - Socket.io [Stop] Client not found ");
    }
  });
  client.on('disconnect', function () {
    delete clients[client.id];
  });
});

stats.init_stats();
// This will run at 3am each day.
// IF you don't set the minute to 0, it will run every minute while it is still 3, so at 3:01, 3:02... etc
schedule.scheduleJob('0 3 * * *', function() {
  db.cleanOldCalls();
});

schedule.scheduleJob('15 3 * * *', function() {
  db.cleanOldEvents();
});

schedule.scheduleJob('30 3 * * *', function() {
  db.cleanOldPodcasts();
});


server.listen(app.get("port"), (err) => {
  if (err) {
    console.err(err.stack)
  } else {
    console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
  }
})


module.exports = app;
