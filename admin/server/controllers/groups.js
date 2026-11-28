const Group = require("../models/group");
const System = require("../models/system");
const mongoose = require("mongoose");

// Strict 24-hex check so `new ObjectId(...)` can never throw.
function isObjectIdString(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id) && mongoose.isValidObjectId(id);
}

// Looks up the system and checks ownership. Responds and returns null when the caller must stop.
async function loadOwnedSystem(req, res, notFoundBody) {
  const system = await System.findOne({ shortName: req.params.shortName.toLowerCase() });
  if (!system) {
    res.status(404);
    res.json(notFoundBody);
    return null;
  }
  if (!system.userId || !system.userId.equals(req.user._id)) {
    res.status(401);
    res.json({
      success: false,
      message: "You are not the user associated with this system."
    });
    return null;
  }
  return system;
}

//router.get('/system/:shortName/group/:groupId?', isLoggedIn, function(req, res) {

exports.getGroups = async function (req, res, next) {
  const system = await loadOwnedSystem(req, res, { success: false });
  if (!system) return;

  if (req.params.groupId) {
    const groupId = req.params.groupId.toLowerCase();
    if (!isObjectIdString(groupId)) {
      res.status(404);
      res.json({ success: false, message: "Group not found." });
      return;
    }

    const group = await Group.findOne(
      {
        _id: new mongoose.Types.ObjectId(groupId),
        shortName: req.params.shortName.toLowerCase()
      },
      { sort: { position: -1 } });
    if (!group) {
      res.status(404);
      res.json({ success: false });
      return;
    }
    res.json(group);
    return;
  }

  const group = await Group.find(
    {
      shortName: req.params.shortName.toLowerCase()
    }).sort("position").exec();
  if (!group) {
    res.status(404);
    res.json({ success: false });
    return;
  }
  res.json(Array.isArray(group) ? group : [group]);
};

exports.deleteGroup = async function (req, res, next) {
  const system = await loadOwnedSystem(req, res, {
    success: false,
    message: "That Short Name does not exist."
  });
  if (!system) return;

  if (!isObjectIdString(req.params.groupId)) {
    res.status(400);
    res.json({ success: false, message: "Invalid group id." });
    return;
  }

  await Group.findOneAndDelete({
    shortName: req.params.shortName.toLowerCase(),
    '_id': new mongoose.Types.ObjectId(req.params.groupId)
  });

  res.json({
    success: true
  });
}

exports.reorderGroups = async function (req, res, next) {
  //router.post('/system/:shortName/group_order', isLoggedIn, function(req, res) {
  const system = await loadOwnedSystem(req, res, {
    success: false,
    message: "That Short Name does not exist."
  });
  if (!system) return;

  if (!req.body || !req.body.groupOrder) {
    res.status(400);
    res.json({
      success: false,
      message: "Order data is wrong."
    });
    return;
  }

  let groupOrder = req.body.groupOrder;
  if (typeof groupOrder === "string") {
    try {
      groupOrder = JSON.parse(groupOrder);
    } catch (e) {
      groupOrder = null;
    }
  }
  if (!Array.isArray(groupOrder) || !groupOrder.every(isObjectIdString)) {
    res.status(400);
    res.json({
      success: false,
      message: "Order data is wrong."
    });
    return;
  }

  for (var i = 0; i < groupOrder.length; i++) {
    const group = await Group.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(groupOrder[i]),
        shortName: req.params.shortName.toLowerCase()
      },
      {
        position: i
      },
      {
        new: true,
        upsert: false
      });
    if (!group) {
      console.log(
        "Error: Group Order - Shortname: " +
        req.params.shortName.toLowerCase()
      );
      res.status(404)
      res.json({
        success: false,
        message: "Group not found: " + groupOrder[i]
      });
      return;
    }
  }
  res.json({
    success: true
  });
};

exports.upsertGroup = async function (req, res, next) {
  //router.post('/system/:shortName/group/:groupId?', isLoggedIn, function(req, res) {
  const system = await loadOwnedSystem(req, res, {
    success: false,
    message: "That Short Name does not exist."
  });
  if (!system) return;

  const body = req.body || {};
  if (typeof body.groupName !== "string") {
    res.status(400);
    res.json({ success: false, message: "Group Name is required" });
    return;
  }
  const groupName = body.groupName.replace(/[^\w\s]/g, "");

  let talkgroups = body.talkgroups;
  if (typeof talkgroups === "string") {
    try {
      talkgroups = JSON.parse(talkgroups);
    } catch (e) {
      talkgroups = null;
    }
  }

  var message = "";
  if (!Array.isArray(talkgroups) || !talkgroups.length) {
    message = "Talkgroups need to be selected, group can not be empty ";
  }
  if (!groupName.length) {
    message = message + "Group Name is required";
  }

  if (message.length) {
    // keeps the original 200 + success:false shape the client already handles
    res.json({
      success: false,
      message: message
    });
    return;
  }
  // if we got here, that means that everything is good for updating/inserting

  const groupId = req.params.groupId;
  if (groupId && !isObjectIdString(groupId)) {
    res.status(400);
    res.json({ success: false, message: "Invalid group id." });
    return;
  }

  const group = await Group.findOneAndUpdate(
    {
      // no groupId (create): ObjectId() generates a fresh id, as before
      _id: groupId ? new mongoose.Types.ObjectId(groupId) : new mongoose.Types.ObjectId(),
      shortName: req.params.shortName.toLowerCase()
    },
    {
      groupName: groupName,
      talkgroups: talkgroups
    },
    {
      new: true,
      upsert: true
    });
  res.json(group);
}
