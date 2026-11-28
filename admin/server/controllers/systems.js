const mongoose = require("mongoose");
const System = require("../models/system");
const Talkgroup = require("../models/talkgroup");
const Group = require("../models/group");
const User = require("../models/user");
const crypto = require("crypto");

// -------------------------------------------


exports.listActiveUsers = async function (req,res,next) {
  if (!req.user.admin) {
    res.status(401);
    res.json({ success: false, message: "Not Authorized" });
    return; 
  }
  let users = {};
  let fromDate = new Date(Date.now() - 60 * 60 * 24 * 30 * 1000);
  const systems = await System.find({lastActive: {$gte: fromDate}}).populate('userId', "screenName");
  for (let index = 0; index < systems.length; index++) {
    const system = systems[index];

    // populate() leaves userId null when the user was deleted
    if (!system.userId) continue;
    const userKey = system.userId.toString();
    if (!users.hasOwnProperty(userKey)) {
      const user = await User.findById(system.userId, "_id email firstName lastName lastLogin");
      if (!user) continue;
      users[userKey] = { email: user.email, firstName: user.firstName, lastName: user.lastName };
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
    res.json({ success: false, message: "No systems found." });
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
    res.json({ success: false, message: "No systems found." });
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

  res.json({
    success: true,
    systems: returnSys
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
  });
  if (!system) {
    res.status(500);
    res.json({
      success: false,
      message: "That Short Name does not exist."
    });
    return;
  }
  if (!system.userId || !system.userId.equals(req.user._id)) {
    console.log("Error deleting syste - Wrong User - sys: " + system.userId + " profile:  " + req.user._id);
    res.status(401);
    res.json({
      success: false,
      message: "You are not the user associated with this system."
    });
    return;
  }
  console.log("Removing: " + system.name);
  // fire and forget as before, but never let a failure become an unhandled rejection
  remove_system(system.shortName).catch(err => console.error("remove_system failed: " + (err && err.stack || err)));
  res.json({
    success: true
  });
  return;
}


// -------------------------------------------
exports.ownSystem = async function (req, res, next) {
  try {
    if (typeof req.body.shortName !== "string") {
      res.status(400);
      res.json({ success: false, message: "System ShortName is Required" });
      return;
    }
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
    if (!system.userId || !system.userId.equals(req.user._id)) {
      console.error("ERROR: OwnSystem - not users system " + req.body.shortName.toLowerCase());
      res.status(500)
      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      console.error("System: " + system.userId + " User: " + req.user._id);
      return;
    }
  } catch (err) {
    console.error("ERROR: ownSystem - caught: " + err);
    res.status(500)
    res.json({
      success: false,
      message: "Internal server error"
    });
    return;
  }
  res.locals.system = system;
  next();

}

// -------------------------------------------
exports.uniqueShortName = async function (req, res, next) {

  var shortName = res.locals.shortName;
  if (typeof shortName == 'undefined') {
    console.error("locals: " + res.locals.shortName + " body: " + req.body.shortName)
    console.error("ShortName is not in res.local, pulling from req.body instead")
    shortName = req.body.shortName;
  }
  if (typeof shortName !== 'string') {
    console.error("ShortName is missing or not a string in req.body")
    res.status(400)
    res.json({
      success: false,
      message: "Shortname not provided in form"
    });
    return;
  }

  shortName = shortName.replace(/[^\w]/gi, '');
  shortName = shortName.toLowerCase();


  try {
    var system = await System.findOne({
      shortName: shortName.toLowerCase()
    });

    if (system) {
      console.error("ERROR: Unique Shortname already in use: " + shortName);
      res.status(500)
      res.json({
        success: false,
        message: "Shortname already in use"
      });
      return;
    }
  } catch (err) {
    console.error("ERROR: Unique ShortName - caught: " + err);
    res.status(500);
    res.json({ success: false, message: "Internal server error" });
    return;
  }
  next();
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


  try {
    await res.locals.system.save();
  } catch (err) {
    console.error("ERROR: updateSystem save - caught: " + (err && err.stack || err));
    res.status(500);
    res.json({
      success: false,
      message: "Could not save the system."
    });
    return;
  }
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
    // body fields must be the right type or later .replace()/casts throw
    for (const field of ["name", "description", "status", "shortName", "systemType", "state", "city", "county", "country"]) {
      const v = req.body[field];
      if (v !== undefined && v !== null && typeof v !== "string") {
        res.status(400);
        res.json({ success: false, message: "Invalid value for " + field + ": expected text" });
        return;
      }
    }
    for (const field of ["showScreenName", "allowContact", "ignoreUnknownTalkgroup"]) {
      const v = req.body[field];
      if (v === undefined || v === null) {
        res.locals[field] = undefined;
      } else if (typeof v === "boolean") {
        res.locals[field] = v;
      } else if (v === "true" || v === "false") {
        res.locals[field] = (v === "true");
      } else {
        res.status(400);
        res.json({ success: false, message: "Invalid value for " + field + ": expected true or false" });
        return;
      }
    }
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
      message: "Internal server error"
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
  let newSys;
  try {
    newSys = await System.create(system);
  } catch (err) {
    console.error("ERROR: createSystem - caught: " + (err && err.stack || err));
    res.status(500)
    res.json({
      success: false,
      message: "Could not create the system."
    });
    return;
  }

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