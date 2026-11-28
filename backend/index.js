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
const { wrap, errorHandler, installProcessHandlers } = require('./lib/safety');

installProcessHandlers("backend");

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


mongoose.connection.on('connecting', () => console.log('Mongoose is connecting'));
mongoose.connection.on('connected', () => console.log('Mongoose is connected'));
mongoose.connection.on('disconnecting', () => console.log('Mongoose is disconnecting'));
mongoose.connection.on("error", (err) => console.error("Mongoose error: " + err));

// Retry until Mongo is reachable. Before the process handlers were added a
// failed first connect crashed the process and Docker retried; now we must.
let connecting = false;
const connect = async () => {
  if (connecting || mongoose.connection.readyState !== 0) return;
  connecting = true;
  try {
    await mongoose.connect(mongoUrl, { maxPoolSize: 50 });
  } catch (err) {
    console.error("Mongoose connect failed, retrying in 5s: " + err);
    setTimeout(connect, 5000);
  } finally {
    connecting = false;
  }
};
connect();
mongoose.connection.on("disconnected", () => setTimeout(connect, 1000));


var upload = multer({
  dest: config.uploadDirectory
});

const clients = require("./client_registry");
const { makeStartHandler } = require("./socket_start");
const handleStart = makeStartHandler({ clients, Group, firehoseKey: firehose_key });

function addSystemClients(req, res, next) {
  req.systemClients = clients.systemCounts();
  next();
}

function addTotalClients(req, res, next) {
  req.totalClients = clients.size();
  next();
}


/*------    CALLS   ----------*/
app.get('/card/:id', wrap(calls.get_card));
app.post('/add_star/:id', wrap(calls.add_star));
app.post('/remove_star/:id', wrap(calls.remove_star));
app.get('/:shortName/call/:id', wrap(calls.get_call));
app.get('/:shortName/calls/latest', wrap(calls.get_latest_calls));
app.get('/:shortName/calls/next', wrap(calls.get_next_calls));
app.get('/:shortName/calls/newer', wrap(calls.get_newer_calls));
app.get('/:shortName/calls/older', wrap(calls.get_older_calls));
app.get('/:shortName/calls/date', wrap(calls.get_date_calls));
app.get('/:shortName/calls/:time/older', wrap(calls.get_iphone_calls));
app.get('/:shortName/calls', wrap(calls.get_calls));


/*------    UPLOADS   ---------- upload.single('call'),  uploads.upload,*/
app.post('/:shortName/upload', upload.single('call'), wrap(uploads.upload), function (req, res) {
  // The recorder already has its 200; a failure here must not reach Express.
  try {
    notify_clients(req.call);
  } catch (err) {
    console.error("[" + req.params.shortName + "] Error notifying clients: " + err);
  }
});

/*------    SYSTEMS   ----------*/
app.get('/systems', wrap(addSystemClients), wrap(systems.get_systems));
app.post('/:shortName/contact', wrap(systems.contact_system));
app.post('/:shortName/authorize', wrap(systems.authorize_system));

/*------    TALKGROUPS   ----------*/
app.get('/:shortName/talkgroups', wrap(talkgroups.get_talkgroups));

/*------    GROUPS   ----------*/
app.get('/:shortName/groups', wrap(talkgroups.get_groups));


/*------    EVENTS   ----------*/
app.post('/events', wrap(events.addNewEvent));
app.get('/events', wrap(events.getEvents));
app.get('/events/:id', wrap(events.getEvent));

/*------    STATS   ----------*/
app.get('/:shortName/stats', wrap(stats.get_stats));
app.get('/stats', addTotalClients, wrap(sys_stats.siteStats))

/*------    SYSTEM STATUS   ----------*/
app.get('/status/:shortName', wrap(systems.get_system_status));


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
        // A firehose client's filterCode is the firehose key; never publish it.
        filterCode: client.firehose ? "firehose" : client.filterCode,
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
app.get('/clients', wrap(get_clients));
app.get('/:shortName/clients', wrap(get_clients));
// Previously this only logged, so any error left the request hanging until
// nginx timed out. Now it answers once.
app.use(errorHandler);



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
    try {
      await handleStart(client, ipAddress, data);
    } catch (err) {
      // A DB error during a group lookup must not become an unhandled rejection.
      console.error("Error - Socket [Start] ClientID: " + client.id + " IP: " + ipAddress + " " + ((err && err.stack) || err));
    }
  });

  client.on('stop', function (data) {
    const entry = clients.get(client.id);
    if (entry) {
      entry.active = false;
      entry.startSeq = (entry.startSeq || 0) + 1; // cancel any 'start' still awaiting a lookup
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
    console.error(err.stack)
  } else {
    console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
  }
})


module.exports = app;
