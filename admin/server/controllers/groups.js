const Group = require("../models/group");
const System = require("../models/system");
const mongoose = require("mongoose");

//router.get('/system/:shortName/group/:groupId?', isLoggedIn, function(req, res) {

exports.getGroups = async function (req, res, next) {
  process.nextTick(async function () {
    const system = await System.findOne({ shortName: req.params.shortName.toLowerCase() });
    if (!system) {
      res.status(404);
      res.json({ success: false });
      return;
    }

    if (!system.userId.equals(req.user._id)) {
      res.status(401)
      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      return;
    }

    if (req.params.groupId) {
      var groupId = req.params.groupId.toLowerCase();

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

      } else {
        res.json(group);
        return;
      }
    } else {
      const group = await Group.findOne(
        {
          shortName: req.params.shortName.toLowerCase()
        }).sort("position").exec();
      if (!group) {
        res.status(404);
        res.json({ success: false });
        return;

      } else {
        let result = group;
        if (!Array.isArray(group)) {
          result = [group]
        }
        res.json(result);
        return;
      }
    }
  }
  );
};

exports.deleteGroup = function (req, res, next) {
  //router.get('/system/:shortName/remove_group/:groupId', isLoggedIn, function(req, res) {
  System.findOne({
    'shortName': req.params.shortName.toLowerCase()
  }, function (err, system) {
    if (err) {
      console.error(err);
      res.json({ success: false, message: err });
      return;
    }
    if (!system) {
      console.error(err);
      res.json({
        success: false,
        message: "That Short Name does not exist."
      });
      return;
    }
    if (!system.userId.equals(req.user._id)) {
      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      return;
    }
    Group.findOneAndRemove({
      shortName: req.params.shortName.toLowerCase(),
      '_id': new mongoose.Types.ObjectId(req.params.groupId)
    }, function (err) {

      if (err) {
        res.json({
          success: false,
          message: err
        });
        return;
      } else {
        res.json({
          success: true
        });
        return;
      }
      // removed!
    });

  });
};

exports.reorderGroups = function (req, res, next) {
  //router.post('/system/:shortName/group_order', isLoggedIn, function(req, res) {
  process.nextTick(async function () {
    const system = await System.findOne({ shortName: req.params.shortName.toLowerCase() });

    if (!system) {
      res.status(404);
      res.json({
        success: false,
        message: "That Short Name does not exist."
      });
      return;
    }
    if (!system.userId.equals(req.user._id)) {
      res.status(401);
      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      return;
    }

    var groupOrder = JSON.parse(req.body.groupOrder);
    for (var i = 0; i < groupOrder.length; i++) {

      console.log("in group: " + groupOrder[i] + " position: " + i);
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
        res.status(404)
        res.json({
          success: false,
          message: err
        });

        console.log(
          "Error: Group Order - Shortname: " +
          req.params.shortName.toLowerCase()
        );
        return;
      }
    }
    res.json({
      success: true
    });
  }
  );
};

exports.upsertGroup = function (req, res, next) {
  //router.post('/system/:shortName/group/:groupId?', isLoggedIn, function(req, res) {
  process.nextTick(async function () {
    let system = System.findOne({ shortName: req.params.shortName.toLowerCase() });

    if (!system) {
      res.status(404);
      res.json({
        success: false,
        message: "That Short Name does not exist."
      });
      return;
    }
    if (!system.userId.equals(req.user._id)) {
      res.status(401);
      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      return;
    }
    var message = "";
    var groupName = req.body.groupName.replace(/[^\w\s]/g, "");
    var talkgroups = JSON.parse(req.body.talkgroups);

    if (!talkgroups.length || !Array.isArray(talkgroups)) {
      message = "Talkgroups need to be selected, group can not be empty ";
    }
    if (!groupName.length) {
      message = message + "Group Name is required";
    }

    if (message.length) {
      res.json({
        success: false,
        message: message
      });
      return;
    }
    // if we got here, that means that everything is good for updating/inserting

    var groupId = req.params.groupId;

    let group = Group.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(groupId),
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


    if (!group) {
      res.status(500);
      res.json({
        success: false,
        message: err
      });
      return;
    } else {
      res.json(group);
      return;
    }
  }
  );
}
