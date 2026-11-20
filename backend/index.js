var express = require("express");
var configureExpress = require("./config/express");

var calls = require("./controllers/calls");
var uploads = require("./controllers/uploads");
var systems = require("./controllers/systems");
var talkgroups = require("./controllers/talkgroups");

var stats = require("./controllers/stats");
var sys_stats = require("./sys_stats");
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

// Must outlast nginx's upstream keepalive_timeout (60s), so nginx is always the
// side that closes an idle connection. Otherwise it can send a request on a
// connection Node has just closed, and nginx won't retry a POST.
server.keepAliveTimeout = 65000;
server.headersTimeout = 70000;


const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});




// -------------------------------------------


configureExpress(app)

// -------------------------------------------

const mongo_host = typeof process.env['MONGO_HOST'] !== 'undefined' ? process.env['MONGO_HOST'] : 'mongo';
const mongo_port = typeof process.env['MONGO_PORT'] !== 'undefined' ? process.env['MONGO_PORT'] : 27017;
const mongo_user = process.env['MONGO_USER'];
const mongo_password = process.env['MONGO_PASSWORD'];
const firehose_key = process.env['FIREHOSE_KEY'] !== 'undefined' ? process.env['FIREHOSE_KEY'] : null;

let mongoUrl;

if ((typeof mongo_user !== 'undefined') && (typeof mongo_password !== 'undefined')) {
  console.log("Using authentication for MongoDB - user: " + mongo_user);
  mongoUrl = 'mongodb://' + mongo_user + ':' + mongo_password + '@' + mongo_host + ':' + mongo_port + '/scanner';
} else {
  mongoUrl = 'mongodb://' + mongo_host + ':' + mongo_port + '/scanner';
}


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

  await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, maxPoolSize: 50 });
  console.log("All Done");
}
connect();

mongoose.connection.on("error", console.error)
mongoose.connection.on("disconnected", connect)


var upload = multer({
  dest: config.uploadDirectory
});

const clients = require("./client_registry");

function addSystemClients(req, res, next) {
  req.systemClients = clients.systemCounts();
  next();
}

function addTotalClients(req, res, next) {
  req.totalClients = clients.size();
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
app.get('/:shortName/calls/date', calls.get_date_calls);
app.get('/:shortName/calls/:time/older', calls.get_iphone_calls);
app.get('/:shortName/calls', calls.get_calls);


/*------    UPLOADS   ---------- upload.single('call'),  uploads.upload,*/
app.post('/:shortName/upload', upload.single('call'), uploads.upload, async function (req, res) {
  notify_clients(req.call);
});

/*------    SYSTEMS   ----------*/
app.get('/systems', addSystemClients, systems.get_systems);
app.post('/:shortName/contact', systems.contact_system);
app.post('/:shortName/authorize', systems.authorize_system);

/*------    TALKGROUPS   ----------*/
app.get('/:shortName/talkgroups', talkgroups.get_talkgroups);

/*------    GROUPS   ----------*/
app.get('/:shortName/groups', talkgroups.get_groups);


/*------    EVENTS   ----------*/
app.post('/events', events.addNewEvent);
app.get('/events', events.getEvents);
app.get('/events/:id', events.getEvent);

/*------    STATS   ----------*/
app.get('/:shortName/stats', stats.get_stats);
app.get('/stats', addTotalClients, sys_stats.siteStats)

/*------    SYSTEM STATUS   ----------*/
app.get('/status/:shortName', systems.get_system_status);


function get_clients(req, res) {
  if (req.params.shortName) {
    var short_name = req.params.shortName.toLowerCase();
  } else {
    var short_name = null;
  }
  var total = 0;
  var response = [];
  for (const client of clients.values()) {
    total++;
    if (!short_name || (client.shortName == short_name)) {
      var age = (Date.now() - client.timestamp) / 1000;
      var obj = {
        shortName: client.shortName,
        filterCode: client.filterCode,
        filterName: client.filterName,
        filterType: client.filterType,
        filterStarred: client.filterStarred,
        active: client.active,
        talkgroupNums: client.talkgroupNums,
        timestamp: age
      }
      response.push(obj);
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

  console.log("Error: " + err);
});



function notify_clients(call) {
  call.type = "calls";
  const message = JSON.stringify(call);
  const sent = clients.notify(call, message);

  if (sent > 0) {
    //console.log("[" + call.shortName.toLowerCase() + "] Sent call to " + sent + " clients");
  }
}

function parseHeader(header) {
  for (const directive of header.split(",")[0].split(";")) {
    if (directive.startsWith("for=")) {
      return directive.substring(4);
    }
  }
}


io.sockets.on('connection', function (client) {
  const header_ipAddress = parseHeader(client.handshake.headers["forwarded"] || "");
  const cf_ipAddress = client.handshake.headers["cf-connecting-ip"];
  const x_ipAddress = client.handshake.headers["x-forwarded-for"]?.split(",")[0];
  const ipAddress = cf_ipAddress || x_ipAddress || header_ipAddress; 
  clients.add(client.id, client);
  client.on('start', async function (data) {
    const entry = clients.get(client.id);
    if (entry) {
      // Stop delivering under any previous filter; re-indexed once this one validates.
      clients.unindex(entry);
      if ((data.filterType != "firehose") && (!data.shortName || (typeof data.shortName != "string"))) {  // If it is not firehose, then it must have a shortName
        console.error("Error - Socket - Invalid ShortName: " + data.shortName + " ClientID: " + client.id + " IP: " + ipAddress);
        clients.remove(client.id);
        return;
      }

      entry.active = true;
      entry.shortName = data.shortName.toLowerCase();
      entry.filterCode = String(data.filterCode);
      entry.filterName = data.filterName;
      entry.filterStarred = data.filterStarred;
      entry.filterType = String(data.filterType);
      entry.talkgroupNums = [];
      entry.timestamp = new Date();
      entry.firehose = false;
      entry.ipAddress = ipAddress;

      // Validate the filterCode and filterType
      if (typeof entry.filterCode != "string") {
        console.error("Error - Socket - Invalid filterCode: " + data.filterCode + " ShortName: " + data.shortName.toLowerCase() + " ClientID: " + client.id + " IP: " + ipAddress);
        clients.remove(client.id);
        return;
      }

      if (typeof entry.filterType != "string") {
        console.error("Error - Socket - Invalid filterType: " + data.filterType + " ShortName: " + data.shortName.toLowerCase() + " ClientID: " + client.id + " IP: " + ipAddress);
        clients.remove(client.id);
        return;
      }

      // Check if the filterType is firehose and the filterCode is the firehose key
      if (data.filterType == "firehose") {
        if (firehose_key && (typeof data.filterCode == "string") && (data.filterCode == firehose_key)) {
          console.log("Enabling Firehose mode for Client: " + client.id + " IP: " + ipAddress);
          entry.firehose = true;
        } else {
          console.error("Error - Socket - Invalid Firehose Key: " + data.filterCode + " ClientID: " + client.id + " Filter Name: " + client.filterName + " IP: " + ipAddress);
          clients.remove(client.id);
          return;
        }
      } else if ((data.filterType == "group")) {       // Handle filterType == "group"
        if ((typeof data.filterCode != "string") || (data.filterCode.indexOf(',') != -1) || !ObjectId.isValid(data.filterCode)) {
          console.error("Error - Socket - Invalid Group ID: " + data.filterCode + " ShortName: " + data.shortName.toLowerCase() + " ClientID: " + client.id + " IP: " + ipAddress);
          clients.remove(client.id);
          return;
        }

        const group = await Group.findOne({ 'shortName': data.shortName.toLowerCase(), '_id': ObjectId.createFromHexString(data.filterCode) });

        if (!clients.get(client.id)) {
          console.error("Error - Socket - Client not found ShortName: " + data.shortName + " ClientID: " + client.id + " IP: " + ipAddress);
          return;
        }
        if (group) {
          entry.talkgroupNums = group.talkgroups;
        } else {
          console.error("Error - Socket - Invalid group " + data.filterCode + " Shortname: " + data.shortName + " ClientID: " + client.id + " IP: " + ipAddress);
          clients.remove(client.id);
          return;
        }
        // Handle filterType == "talkgroup"
      } else if ((data.filterType == "talkgroup") && Array.isArray(data.filterCode)) {
        entry.talkgroupNums = data.filterCode;
      } else if ((data.filterType == "all") && (data.filterCode == "")) {
        // Handle filterType == "all"
        entry.talkgroupNums = [];
      } else {
        console.error("Error - Socket - Invalid Filter Type: " + data.filterType + " Filter Code: " + data.filterCode + " Filter Name: " + data.filterName + " ShortName: " + data.shortName.toLowerCase() + " ClientID: " + client.id + " IP: " + ipAddress);
        clients.remove(client.id);
        return;
      }
      // All checks passed: start delivering calls under the new filter.
      clients.index(entry);
    } else {
      console.error("Error - Socket.io [Start] either client not found, shortName:" + data.shortName + " ClientID: " + client.id + " IP: " + ipAddress);
    }
  });

  client.on('stop', function (data) {
    const entry = clients.get(client.id);
    if (entry) {
      entry.active = false;
      clients.unindex(entry);
    } else {
      console.error("Error - Socket.io [Stop] Client not found ");
    }
  });
  client.on('disconnect', function () {
    clients.remove(client.id);
  });
});

stats.init_stats();
// This will run at 3am each day.
// IF you don't set the minute to 0, it will run every minute while it is still 3, so at 3:01, 3:02... etc
schedule.scheduleJob('0 3 * * *', function () {
  db.cleanOldCalls();
});

schedule.scheduleJob('15 3 * * *', function () {
  db.cleanOldEvents();
});

schedule.scheduleJob('30 3 * * *', function () {
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
