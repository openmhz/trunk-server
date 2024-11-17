const mongoose = require("mongoose");
const System = require("../models/system");
const SystemStat = require("../models/system_stat");
const Talkgroup = require("../models/talkgroup");
const Group = require("../models/group");
const User = require("../models/user");
const crypto = require("crypto");

exports.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect(account_server + "/login");
};

// -------------------------------------------


exports.listActiveUsers = async function (req,res,next) {
  if (!req.user.admin) {
    res.status(401);
    res.json({ success: false, message: "Not Authorized" });
    return; 
  }
  let users = {};
  let fromDate = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000);
  const systems = await System.find({lastActive: {$gte: fromDate}}).populate('userId', "screenName").catch( err => {
     console.error("Error - get_systems: " + err.message);
      res.json({
        success: false,
        message: err
      });
      return;
  });
  for (let index = 0; index < systems.length; index++) {
    const system = systems[index];

    if (!users.hasOwnProperty(system.userId.toString())) {
      const user = await User.findById(system.userId, "_id email firstName lastName lastLogin");
      users[system.userId.toString()] = { email: user.email, firstName: user.firstName, lastName: user.lastName };   
    }

  }

  let list = [];
  for (const id in users) {
    list.push(users[id]);
  }

  res.json(list);
  return;
}


exports.listUserSystems = async function (req,res,next) {
  if (!req.user.admin) {
    res.status(401);
    res.json({ success: false, message: "Not Authorized" });
    return;
  }
  const users = await User.find({}, "_id email firstName lastName lastLogin");
  let list = [];
  for (let index = 0; index < users.length; index++) {
    let user = users[index].toObject();
    const userId = new mongoose.Types.ObjectId(user._id);
    const systems = await System.find({ userId: userId }, "name shortName description status systemType city state county country lastActive");

    user["systems"] = systems;
    list.push(user);
  }
  res.json(list);
  return;
}

exports.listAllSystems = async function (req, res, next) {
  if (!req.user.admin) {
    res.status(401);
    res.json({ success: false, message: "Not Authorized" });
    return;
  }

  const systems = await System.find().exec();
  if (systems == null) {
    res.status(400);
    res.json({ success: false, message: err });
    return;
  }

  let returnSys = systems.map(obj => {
    var rObj = (({
      name,
      shortName,
      description,
      status,
      systemType,
      city,
      state,
      county,
      country,
      userId,
      key,
      showScreenName,
      allowContact,
      ignoreUnknownTalkgroup,
      lastActive,
      active
    }) => ({
      name,
      shortName,
      description,
      status,
      systemType,
      city,
      state,
      county,
      country,
      userId,
      key,
      showScreenName,
      allowContact,
      ignoreUnknownTalkgroup,
      lastActive,
      active
    }))(obj);


    rObj.id = obj._id;
    return rObj;
  });


  res.json({
    success: true,
    systems: returnSys
  });
  return;
};

exports.listSystems = async function (req, res, next) {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const systems = await System.find({ userId: userId }).exec();
  if (systems == null) {
    res.status(400);
    res.json({ success: false, message: err });
    return;
  }

  let shortNames = new Array();
  for (var i = 0; i < systems.length; i++) {
    shortNames.push(systems[i].shortName);
  }



  let returnSys = systems.map(obj => {
    var rObj = (({
      name,
      shortName,
      description,
      status,
      systemType,
      city,
      state,
      county,
      country,
      userId,
      key,
      showScreenName,
      allowContact,
      ignoreUnknownTalkgroup
    }) => ({
      name,
      shortName,
      description,
      status,
      systemType,
      city,
      state,
      county,
      country,
      userId,
      key,
      showScreenName,
      allowContact,
      ignoreUnknownTalkgroup
    }))(obj);
    if (obj.showScreenName) {
      rObj.screenName = req.user.screenName;
    } else {
      rObj.screenName = null;
    }
    rObj.id = obj._id;
    return rObj;
  });

  const stats = await SystemStat.find({ shortName: { $in: shortNames } }).exec();
  var sys_stats = {}
  for (var i = 0; i < stats.length; i++) {
    sys_stats[stats[i].shortName] = {
      uploadErrors: stats[i].uploadErrors,
      callTotals: stats[i].callTotals,
      talkgroupStats: stats[i].talkgroupStats,
      decodeErrorsFreq: stats[i].decodeErrorsFreq
    };
  }

  res.json({
    success: true,
    systems: returnSys,
    stats: sys_stats
  });
  return;
};

const remove_system = async (shortName) => {

  await System.deleteOne({
    shortName: shortName
  }).catch(err => console.error(err));

  await Talkgroup.deleteMany({
    shortName: shortName
  }).catch(err => console.error(err));


  await Group.deleteMany({
    shortName: shortName
  }).catch(err => console.error(err));
}

exports.deleteSystem = async function (req, res, next) {
  //router.get('/delete_system/:shortName', isLoggedIn, function(req, res) {
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
    res.status(500);
    res.json({
      success: false,
      message: "That Short Name does not exist."
    });
    return;
  }
  if (!system.userId.equals(req.user._id)) {
    console.log("Error deleting syste - Wrong User - sys: " + system.userId + " profile:  " + mongoose.Types.ObjectId(req.user._id));
    res.status(401);
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


// -------------------------------------------
exports.ownSystem = async function (req, res, next) {
  try {
    var system = await System.findOne({
      shortName: req.body.shortName.toLowerCase()
    });

    if (!system) {
      console.error("ERROR: OwnSystem - system does not exist: " + req.body.shortName.toLowerCase());
      res.status(500)
      res.json({
        success: false,
        message: "That System does not exist."
      });
      return;
    }
    if (!system.userId.equals(req.user._id)) {
      console.error("ERROR: OwnSystem - not users system " + req.body.shortName.toLowerCase());
      res.status(500)
      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      console.error("System: " + system.userId + " User: " + req.user._id);
      return;
    }
    res.locals.system = system;
    next();

  } catch (err) {
    console.error("ERROR: ownSystem - caught: " + err);
    res.status(500)
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
    console.error("locals: " + res.locals.shortName + " body: " + req.body.shortName)
    console.error("ShortName is not in res.local, pulling from req.body instead")
    shortName = req.body.shortName;
  }
  if (typeof shortName == 'undefined') {
    console.error("ShortName is not in req.body instead")
    res.status(500)
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
      res.status(500)
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
    res.status(500);
    res.json({ message: "ERROR: Unique ShortName - caught: " + err });
    return;
  }

}


// -------------------------------------------

// All the values you want to use here need to be copied over in validateSystem()

exports.updateSystem = async function (req, res, next) {

  res.locals.system.name = res.locals.name;
  res.locals.system.city = res.locals.city;
  res.locals.system.state = res.locals.state;
  res.locals.system.county = res.locals.county;
  res.locals.system.country = res.locals.country;
  res.locals.system.description = res.locals.description;
  res.locals.system.status = res.locals.status;
  res.locals.system.systemType = res.locals.systemType;
  res.locals.system.showScreenName = res.locals.showScreenName;
  res.locals.system.allowContact = res.locals.allowContact;
  res.locals.system.ignoreUnknownTalkgroup = res.locals.ignoreUnknownTalkgroup;


  await res.locals.system.save().catch(err => {
    res.status(500);
    res.json({
      success: false,
      message: err
    });
    return;
  });
  var returnSys = (({
    name,
    shortName,
    description,
    status,
    systemType,
    city,
    state,
    county,
    country,
    userId,
    key,
    showScreenName,
    allowContact,
    ignoreUnknownTalkgroup
  }) => ({
    name,
    shortName,
    description,
    status,
    systemType,
    city,
    state,
    county,
    country,
    userId,
    key,
    showScreenName,
    allowContact,
    ignoreUnknownTalkgroup
  }))(res.locals.system);
  returnSys.id = res.locals.system._id;
  res.json(returnSys);
  return;
}



// -------------------------------------------

exports.validateSystem = async function (req, res, next) {
  try {
    res.locals.showScreenName = req.body.showScreenName;
    res.locals.ignoreUnknownTalkgroup = req.body.ignoreUnknownTalkgroup;
    res.locals.allowContact = req.body.allowContact;
    if (!req.body.name || (req.body.name.length < 2)) {
      console.error("ERROR: Validate System - req.body.name");
      res.status(500)
      res.json({
        success: false,
        message: "System Name is Required"
      });
      return;
    }
    res.locals.name = req.body.name.replace(/[^\w\s\.\,\-\_]/gi, '');

    if (!req.body.description || (req.body.description.length < 2)) {
      console.error("ERROR: Validate System - req.body.description: " + req.body.description);
      res.status(500)
      res.json({
        success: false,
        message: "System Description is Required"
      });
      return;
    }
    res.locals.description = req.body.description.replace(/[^\w\s\.\,\-\_\(\)\'\"\!\?\*\&\^\%\$\#\@\r\n\t\`\~\[\]\/\\]/gi, '');

    if (req.body.status) {
      res.locals.status = req.body.status.replace(/[^\w\s\.\,\-\_\(\)\'\"\!\?\*\&\^\%\$\#\@\r\n\t\`\~\[\]\/\\]/gi, '');
    } else {
      res.locals.status = "";
    }
    
    if (!req.body.shortName || (req.body.shortName.length < 2)) {
      console.error("ERROR: Validate System - req.body.shortName");
      res.status(500)
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
      res.status(500)
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
        res.status(500)
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
        res.status(500)
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
        res.status(500)
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
        res.status(500)
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
    res.status(500)
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
    status,
    systemType,
    city,
    state,
    county,
    country,
    showScreenName,
    allowContact,
    ignoreUnknownTalkgroup
  }) => ({
    name,
    shortName,
    description,
    status,
    systemType,
    city,
    state,
    county,
    country,
    showScreenName,
    allowContact,
    ignoreUnknownTalkgroup
  }))(res.locals);
  system.key = key;
  system.userId = new mongoose.Types.ObjectId(req.user._id);
  const newSys = await System.create(system).catch(err => {

    console.error(err);
    res.status(500)
    res.json({
      success: false,
      message: err
    });
    return;
  });

  var returnSys = (({
    name,
    shortName,
    description,
    status,
    systemType,
    city,
    state,
    county,
    country,
    userId,
    showScreenName,
    allowContact,
    ignoreUnknownTalkgroup,
    key
  }) => ({
    name,
    shortName,
    description,
    status,
    systemType,
    city,
    state,
    county,
    country,
    userId,
    showScreenName,
    allowContact,
    ignoreUnknownTalkgroup,
    key
  }))(newSys);
  returnSys.id = newSys._id;
  res.json(returnSys);
  return;

}