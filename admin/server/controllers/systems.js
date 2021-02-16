const mongoose = require("mongoose");
const System = require("../models/system");
const SystemStat = require("../models/system_stat");
const Talkgroup = require("../models/talkgroup");
const Group = require("../models/group");
const crypto = require("crypto");

exports.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect(account_server + "/login");
};

// -------------------------------------------

exports.listSystems = function (req, res, next) {
  console.log("Listing Systems for: " + req.user._id);
  System.find({
      userId: mongoose.Types.ObjectId(req.user._id)
    },
    function (err, systems) {
      if (err) {
        console.error("Error - ListSystems: " + err);
        res.json({
          success: false,
          message: err
        });
        return;
      }

      var shortNames = new Array();
      for (var i = 0; i < systems.length; i++) {
        shortNames.push(systems[i].shortName);
      }

      SystemStat.find({
          shortName: {
            $in: shortNames
          }
        },
        function (err, stats) {
          var returnSys = systems.map(obj => {
            var rObj = (({
              name,
              shortName,
              description,
              systemType,
              city,
              state,
              county,
              country,
              userId,
              key,
              showScreenName
            }) => ({
              name,
              shortName,
              description,
              systemType,
              city,
              state,
              county,
              country,
              userId,
              key,
              showScreenName
            }))(obj);
            if (obj.showScreenName) {
              rObj.screenName = req.user.screenName;
            } else {
              rObj.screenName = null;
            }
            rObj.id = obj._id;
            return rObj;
          });
          var sys_stats = {}
          var MS_PER_MINUTE = 60000;
          var now = new Date();
          for (var i = 0; i < stats.length; i++) {
            sys_stats[stats[i].shortName] = {};

            sys_stats[stats[i].shortName].callTotals = stats[i].callTotals;
            sys_stats[stats[i].shortName].errorTotals = stats[i].errorTotals;
            sys_stats[stats[i].shortName].errorStats = stats[i].errorStats;
            sys_stats[stats[i].shortName].usageBytes = stats[i].usageBytes;
            sys_stats[stats[i].shortName].usageMb = stats[i].usageMb;
          }

          res.json({
            success: true,
            systems: returnSys,
            stats: sys_stats
          });
          return;
        }
      );
    }
  );
};

function remove_system(shortName) {
  /*
    var sysDir = config.mediaDirectory + "/" + shortName + "/"
    console.log("Removing DIR: " + sysDir);
    fs.remove(sysDir, function(err) {
        if (err) return console.error(err)
    });

    Transmission.remove({
        shortName: shortName
    }, function(err) {
        if (err) return console.error(err);
        // removed!
    });
*/
  System.remove({
      shortName: shortName
    },
    function (err) {
      if (err) return console.error(err);
      // removed!
    }
  );

  Talkgroup.remove({
      shortName: shortName
    },
    function (err) {
      if (err) return console.error(err);
      // removed!
    }
  );

  Group.remove({
      shortName: shortName
    },
    function (err) {
      if (err) return console.error(err);
      // removed!
    }
  );
}

exports.deleteSystem = function (req, res, next) {
  //router.get('/delete_system/:shortName', isLoggedIn, function(req, res) {
  System.findOne({
      shortName: req.params.shortName.toLowerCase()
    },
    function (err, system) {
      if (err) {
        res.json({
          success: false,
          message: err
        });
        return;
      }
      if (!system) {
        res.json({
          success: false,
          message: "That Short Name does not exist."
        });
        return;
      }
      if (!system.userId.equals(req.user._id)) {
        console.log("Error deleting syste - Wrong User - sys: " + system.userId + " profile:  " + mongoose.Types.ObjectId(req.user._id));
        res.json({
          success: false,
          message: "You are not the user associated with this system."
        });
        return;
      }
      console.log("Removing: " + system.name);
      remove_system(system.shortName);
      res.json({
        success: true
      });
      return;
    }
  );
};

// -------------------------------------------
exports.ownSystem = async function (req, res, next) {
  try {
    var system = await System.findOne({
      shortName: req.body.shortName.toLowerCase()
    });

    if (!system) {
      console.error("ERROR: OwnSystem - system does not exist: " + req.body.shortName.toLowerCase());
      res.json({
        success: false,
        message: "That System does not exist."
      });
      return;
    }
    if (!system.userId.equals(req.user._id)) {
      console.error("ERROR: OwnSystem - not users system " + req.body.shortName.toLowerCase());

      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      console.error("System: " + system.userId + " User: " + req.user._id);
      return;
    }

    res.locals.test = "Yoho!"
    res.locals.system = system;
    console.log(system);
    console.log(res.locals);
    next();

  } catch (err) {
    console.error("ERROR: ownSystem - caught: " + err);
    res.json({
      success: false,
      message: err
    });
    return;
  }

}

// -------------------------------------------
exports.uniqueShortName = async function (req, res, next) {

  var shortName = res.locals.shortName;
  if (typeof shortName == 'undefined') {
    console.error("locals: " + res.locals.shortName + " body: " + req.body.shortName )
    console.error("ShortName is not in res.local, pulling from req.body instead")
    shortName = req.body.shortName;
  }
  if (typeof shortName == 'undefined') {
    console.error("ShortName is not in req.body instead")
    res.json({
      success: false,
      message: "Short Name not provided in form"
    });
  }

  try {
    var system = await System.findOne({
      shortName: shortName.toLowerCase()
    });

    if (system) {
      console.error("ERROR: Unique Shortname already in use: " + req.body.shortName.toLowerCase());
      res.json({
        success: false,
        message: "Short Name already in use"
      });
      return;
    } else {
      next();
    }


  } catch (err) {
    console.error("ERROR: Unique ShortName - caught: " + err);
    res.json({
      success: false,
      message: err
    });
    return;
  }

}


// -------------------------------------------

exports.updateSystem = async function (req, res, next) {

  console.log(res.locals)
  res.locals.system.name = res.locals.name;
  res.locals.system.city = res.locals.city;
  res.locals.system.state = res.locals.state;
  res.locals.system.county = res.locals.county;
  res.locals.system.country = res.locals.country;
  res.locals.system.description = res.locals.description;
  res.locals.system.systemType = res.locals.systemType;
  res.locals.system.showScreenName = res.locals.showScreenName;

  res.locals.system.save(function (err) {
    if (err) {
      res.json({
        success: false,
        message: err
      });
      return;
    } else {
      var returnSys = (({
        name,
        shortName,
        description,
        systemType,
        city,
        state,
        county,
        country,
        userId,
        key,
        showScreenName
      }) => ({
        name,
        shortName,
        description,
        systemType,
        city,
        state,
        county,
        country,
        userId,
        key,
        showScreenName
      }))(res.locals.system);
      returnSys.id = res.locals.system._id;
      res.json({
        success: true,
        system: returnSys
      });
      return;
    }
  });
}

// -------------------------------------------

exports.validateSystem = async function (req, res, next) {
  try {
    res.locals.showScreenName = req.body.showScreenName;

    if (!req.body.name || (req.body.name.length < 2)) {
      console.error("ERROR: Validate System - req.body.name");
      res.json({
        success: false,
        message: "System Name is Required"
      });
      return;
    }
    res.locals.name = req.body.name.replace(/[^\w\s\.\,\-\_]/gi, '');

    if (!req.body.description || (req.body.description.length < 2)) {
      console.error("ERROR: Validate System - req.body.description");
      res.json({
        success: false,
        message: "System Description is Required"
      });
      return;
    }
    res.locals.description = req.body.description.replace(/[^\w\s\.\,\-\_]/gi, '');

    if (!req.body.shortName || (req.body.shortName.length < 2)) {
      console.error("ERROR: Validate System - req.body.shortName");
      res.json({
        success: false,
        message: "System ShortName is Required"
      });
      return;
    }
    var tempShortName = req.body.shortName.replace(/[^\w]/gi, '');
    res.locals.shortName = tempShortName.toLowerCase();

    // -------------------- Handle all the different SystemTypes of Locations


    // make sure it is one of the expected types
    if ((req.body.systemType != "state") && (req.body.systemType != "city") && (req.body.systemType != "county") && (req.body.systemType != "international")) {
      console.error("ERROR: Validate System - req.body.systemType: " + req.body.systemType);
      res.json({
        success: false,
        message: "Select system location"
      });
      return;
    }

    // copy it over
    res.locals.systemType = req.body.systemType;

    // now check to make sure the correct things for location is filled out
    if (req.body.systemType === "state" ||
      req.body.systemType === "city" ||
      req.body.systemType === "county") {
      if (!req.body.state || (req.body.state === "") || (req.body.state.length < 2)) {
        console.error("ERROR: Validate System - req.body.state: " + req.body.state);
        res.json({
          success: false,
          message: "Select the State for the System"
        });
        return;
      }
      res.locals.state = req.body.state;
    }

    if (req.body.systemType === "city") {
      if (!req.body.city || (req.body.city === "") || (req.body.city.length < 2)) {
        console.error("ERROR: Validate System - req.body.systemType: " + req.body.systemType);
        res.json({
          success: false,
          message: "Enter the city for the System"
        });
        return;
      }
      res.locals.city = req.body.city.replace(/[^\w\s\.\,\-\_]/gi, '');
    }

    if (req.body.systemType === "county") {
      if (!req.body.county || (req.body.county === "") || (req.body.county.length < 2)) {
        console.error("ERROR: Validate System - req.body.county: " + req.body.county);
        res.json({
          success: false,
          message: "Enter the county for the System"
        });
        return;
      }
      res.locals.county = req.body.county.replace(/[^\w\s\.\,\-\_]/gi, '');
    }

    if (req.body.systemType === "international") {
      if (!req.body.country || (req.body.country === "") || (req.body.country.length < 2)) {
        console.error("ERROR: Validate System - req.body.country: " + req.body.country);
        res.json({
          success: false,
          message: "Enter the country for the System"
        });
        return;
      }
      res.locals.country = req.body.country.replace(/[^\w\s\.\,\-\_]/gi, '');
    }


  } catch (err) {
    console.error("ERROR: Validate System - caught: " + err);
    res.json({
      success: false,
      message: err
    });
    return;
  }
  next();
}



// -------------------------------------------

exports.createSystem = async function (req, res, next) {

  var key = crypto.randomBytes(16).toString("hex");
  const system = (({
    name,
    shortName,
    description,
    systemType,
    city,
    state,
    county,
    country,
    showScreenName
  }) => ({
    name,
    shortName,
    description,
    systemType,
    city,
    state,
    county,
    country,
    showScreenName
  }))(res.locals);
  system.key = key;
  system.userId = mongoose.Types.ObjectId(req.user._id);
  System.create(system, function (err, newSys) {
    if (err) {
      console.error(err);
      res.json({
        success: false,
        message: err
      });
      return;
    }
    var returnSys = (({
      name,
      shortName,
      description,
      systemType,
      city,
      state,
      county,
      country,
      userId,
      showScreenName,
      key
    }) => ({
      name,
      shortName,
      description,
      systemType,
      city,
      state,
      county,
      country,
      userId,
      showScreenName,
      key
    }))(newSys);
    returnSys.id = newSys._id;
    res.json({
      success: true,
      system: returnSys
    });
    return;
  });
}