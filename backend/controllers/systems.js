var mongoose = require("mongoose");
var User = require("../models/user");
var System = require("../models/system");

exports.get_systems = function (req, res) {
  let fromDate = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000);
  System.find({lastActive: {$gte: fromDate}}).populate('userId', "screenName").
  exec(function (err, results) {
    if (err) {
      console.error("Error - get_systems: " + err.message);
      res.json({
        success: false,
        message: err
      });
      return;
    }
    var systemList = [];
    for (var result in results) {

      var clientCount = 0;
      if (req.systemClients.hasOwnProperty(results[result].shortName)) {
        clientCount = req.systemClients[results[result].shortName];
      }
      var system = {
        name: results[result].name,
        shortName: results[result].shortName,
        systemType: results[result].systemType,
        county: results[result].count,
        country: results[result].country,
        city: results[result].city,
        state: results[result].state,
        active: results[result].active,
        lastActive: results[result].lastActive,
        callAvg: results[result].callAvg,
        description: results[result].description,
        planType: results[result].planType,
        clientCount: clientCount
      }
      if (results[result].showScreenName && results[result].userId) {
        system.screenName = results[result].userId.screenName
      } else {
        system.screenName = null;
      }
      systemList.push(system);
    }
    res.contentType('json');
    res.send(JSON.stringify({
      success: true,
      systems: systemList
    }));
  });

}