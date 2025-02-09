var mongoose = require("mongoose");
var User = require("../models/user");
var System = require("../models/system");
const Mailjet = require('node-mailjet');
var schedule = require('node-schedule');

var admin_email = process.env['REACT_APP_ADMIN_EMAIL'] != null ? process.env['REACT_APP_ADMIN_EMAIL'] : "luke@openmhz.com";
var admin_server = process.env['REACT_APP_ADMIN_SERVER'] != null ? process.env['REACT_APP_ADMIN_SERVER'] : "https://admin.openmhz.com";
var site_name = process.env['REACT_APP_SITE_NAME'] != null ? process.env['REACT_APP_SITE_NAME'] : "OpenMHz";

const mailjet = new Mailjet({
  apiKey: process.env['MAILJET_KEY'],
  apiSecret: process.env['MAILJET_SECRET']
});

var systemList = [];

exports.contact_system = async function (req, res) {
  var system = await System.findOne({
    shortName: req.params.shortName.toLowerCase()
  }).catch(err => {
    res.status(500);
    res.json({
      success: false,
      message: err
    });
    return;
  });
  if (!system) {
    console.error("[contact_system] The Short Name does not exist: " + req.params.shortName.toLowerCase());
    res.status(500);
    res.json({
      success: false,
      message: "That Short Name does not exist."
    });
    return;
  }
  if (!system.allowContact) {
    console.error("[contact_system] This System does not allow user to contact the owner: " + req.params.shortName.toLowerCase());
    res.status(500);
    res.json({
      success: false,
      message: "This System does not allow user to contact the owner."
    });
    return;
  }
  const user = await User.findById(system.userId).exec();
  if (!user) {
    console.error("[contact_system] System User does not exist: " + req.params.shortName.toLowerCase());
    res.status(500);
    res.json({
      success: false,
      message: "System User does not exist."
    });
    return;
  }

  let message = "Thank you for contributing a feed to OpenMHz. A user has sent in a message about this feed:\n\n-------------------------------\n"
  message = message + "User Name: " + req.body.name + "\n";
  message = message + "User Email: " + req.body.email + "\n-------------------------------\n";
  message = message + "Message:\n" + req.body.message + "\n-------------------------------\n\n";
  message = message + "If you wish to stop receiving User Messages for this System:\n - goto the Admin for " + site_name + ": " + admin_server + "\n - find this System\n - Update it and turn off this Allow Contact option."
  const request = mailjet.post("send", {
    version: "v3.1"
  }).request({
    Messages: [{
      From: {
        Email: admin_email,
        Name: site_name + " Admin"
      },
      ReplyTo: {
        Email: req.body.email,
        Name: req.body.name
      },
      To: [{
        Email: user.email,
        Name: user.firstName + " " + user.lastName
      }, {
        Email: admin_email,
        Name: site_name + " Admin"
      }],
      Subject: site_name + " - " + system.shortName + " - " + " User Comment",
      TextPart: message
    }]
  });
  request.then(result => {
    console.log(`User Comment sent to: ${user.email} for shortName: ${system.shortName}`)
    res.json({
      success: true
    });
  })
    .catch(err => {
      console.error(err.statusCode);
      console.error(err);
      res.status(500);
      res.json({
        success: false,
        message: "Failed to send"
      });
      return;
    });


}

async function load_systems(systemClients) {
  let fromDate = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000);
  const results = await System.find({ lastActive: { $gte: fromDate } }).populate('userId', "screenName").catch(err => {
    //const results = await System.find({active: true}).populate('userId', "screenName").catch( err => {
    //const results = await System.find({active: true}).catch( err => {  // super simple query
    console.error("Error - get_systems: " + err.message);
  });
  tempList = [];
  for (var result in results) {

    var clientCount = 0;
    if (systemClients && systemClients.hasOwnProperty(results[result].shortName)) {
      clientCount = systemClients[results[result].shortName];
    }
    var system = {
      name: results[result].name,
      shortName: results[result].shortName,
      systemType: results[result].systemType,
      county: results[result].county,
      country: results[result].country,
      city: results[result].city,
      state: results[result].state,
      active: results[result].active,
      lastActive: results[result].lastActive,
      callAvg: results[result].callAvg,
      description: results[result].description,
      status: results[result].status,
      allowContact: results[result].allowContact,
      clientCount: clientCount
    }
    /*
    if (results[result].showScreenName && results[result].userId) {
      system.screenName = results[result].userId.screenName
    } else {
      system.screenName = null;
    }*/
    system.screenName = null;
    tempList.push(system);
  }
  // don't update the systemList until we have all the data or else load_systems will be called multiple times
  systemList = tempList;
  // console.log("Loaded Systems: " + systemList.length + " that have been active since: " + fromDate);
}

exports.get_system_status = async function (req, res) {
  var shortName = req.params.shortName.toLowerCase();
  var system = systemList.find(function (element) {
    return element.shortName == shortName;
  });

  var response = {
    name: system.name,
    description: system.description,
    active: system.active,
    lastActive: system.lastActive,
    clientCount: system.clientCount,
    callAvg: system.callAvg,
    requestTime: Date.now()
  }
  res.contentType('json');
  res.send(JSON.stringify(response));
}

exports.get_systems = async function (req, res) {
  /* going to use a cron job to update the system list every 2 minutes
  if ((systemList.length == 0) || (systemListTime < (Date.now() - 60 * 1000 * 2))) {
    console.log("Loading Systems - systemTime: " + systemListTime + " compare to: " + (Date.now() - 60 * 1000 * 2));
    systemListTime = Date.now(); // set this first to prevent multiple calls to load_systems
    await load_systems(req.systemClients);
  }*/

  const systemClients = req.systemClients || {};
  for (var i = 0; i < systemList.length; i++) {
    var system = systemList[i];
    var shortName = system.shortName;
    if (systemClients.hasOwnProperty(shortName)) {
      system.clientCount = systemClients[shortName];
    }
  }
  res.contentType('json');
  res.send(JSON.stringify({
    success: true,
    systems: systemList
  }));
}

exports.authorize_system = async function (req, res) {

  var shortName = req.params.shortName.toLowerCase();
  var apiKey = req.body.api_key;
  let item = null;

  try {
    item = await System.findOne({ 'shortName': shortName }, ["key"]);
  } catch (err) {
    console.warn("[" + req.params.shortName + "] Error /:shortName/authorize - Error: " + err);
    res.status(500);
    res.send("Invalid System Name\n");
    return;
  }

  if (!item) {
    console.info("[" + req.params.shortName + "] Error /:shortName/authorize ShortName does not exist");
    res.status(500);
    res.send("Invalid System Name\n");
    return;
  }

  if (apiKey != item.key) {
    console.warn("[" + req.params.shortName + "] Error /:shortName/authorize API Key Mismatch - Provided key: " + apiKey);
    res.status(403);
    res.send("Invalid API Key\n");
    return;
  } else {
    // System shortName exists and the API Key is valid.
    res.status(200).end();
  }

}

load_systems();

var statSched = schedule.scheduleJob('*/5 * * * *', function() {
  load_systems();
});

