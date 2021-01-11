const mongoose = require("mongoose");
const Permission = require("../models/permission");
const System = require("../models/system");
const User = require("../models/user");

exports.fetchPermissions = function(req, res, next) {
  Permission.find(
    {
      shortName: req.params.shortName.toLowerCase()
    },
    function(err, permissions) {
      if (err) {
        console.error(err);
        res.json({ success: false, message: err });
        return;
      }
      var userIds = permissions.map(permission => {return permission.userId});
      User.find(
        {
          _id: {
            $in: userIds
          }
        },
        function(err, users) {
          if (err) {
            console.error(err);
            res.json({ success: false, message: err });
            return;
          }
          var returnUsers = users.map(user =>{
            var permission = permissions.find(obj => {

              if (obj.userId.toString() == user._id.toString()) {
                return true;
              }
              return false;
            });
            if (!permission) {
              console.error("Error - Permission not found for user: " + user._id);
              res.json({ success: false, message: "Permission not found" });
              return;
            }
            return {_id: permission._id, userId: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: permission.role };
          });

          res.json({ success: true, permissions: returnUsers });
        });
      return;
    }
  );
};


exports.addPermission = async (req, res, next) => {
  //router.post('/system/:shortName/group/:groupId?', isLoggedIn, function(req, res) {


    let role = req.body.role;
    var system = false;
    var user = false;
    var existing = false;
    var saved = false;
    if (!role || (role >= 20) || (role <1)) {
      res.json({
        success: false,
        message: "Invalid Role"
      });
      return;
    }
    console.log("role looks good");
    try {
    system = await System.findOne(
      {
        shortName: req.params.shortName.toLowerCase()
      });
    } catch(err) {
      console.error(err);
      res.json({ success: false, message: err });
      return;
    }

    if (!system) {
      res.json({
        success: false,
        message: "That System does not exist."
      });
      return;
    }
    console.log("system looks good")
    try {
      user = await User.findOne(
      {
        email: req.body.email
      });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: err });
      return;
    }

    if (!user) {
      res.json({ success: false, message: "User not found" });
      return;
    }
    console.log("user looks good")
    try {
      existing = await Permission.findOne({userId: user._id, systemId: system._id});
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: err });
      return;
    }

    if (existing) {
      res.json({ success: false, message: "User already has acccess" });
      return;
    }
    console.log("no existing")
    var permission = new Permission({
      userId: user._id,
      systemId: system._id,
      shortName: system.shortName,
      role: role
    });


    try {
      saved = await permission.save()
    } catch(err) {

      res.json({
        success: false,
        message: err
      });
      return;
    }
    console.log("saved it")
    var newPermission = saved.toObject();
    newPermission.firstName = user.firstName;
    newPermission.lastName = user.lastName;
    newPermission.email = user.email;


    console.log("Add Permission to: " + system.shortName + " for: " +  newPermission.email + " by: " + req.user.email);
    res.json({
      success: true,
      permission: newPermission
    });
};


exports.updatePermission = function(req, res, next) {
  process.nextTick(function() {
        Permission.findOne(
          {
            _id: new mongoose.Types.ObjectId(req.params.permissionId),
            shortName: req.params.shortName.toLowerCase(req.params.shortName)
          },

          function(err, permission) {
            if (err) {
              res.json({
                success: false,
                message: err
              });
              return;
            }
            if (permission.role >= 20) {
              res.json({
                success: false,
                message: "Cannot change permissions of system owner"
              });
              return;
            }
            var newRole = req.body.role;
            if (!newRole || (newRole >= 20) || (newRole <1)) {
              res.json({
                success: false,
                message: "Invalid Role"
              });
              return;
            }
            permission.role = newRole;
            permission.save(function(err, saved) {
              if (err) {
                res.json({
                  success: false,
                  message: err
                });
                return;
              }
              res.json({
                success: true,
                permission: saved.toJSON()
              });
              return;

            });
          }
        );

  });
};


exports.deletePermission = function(req, res, next) {
//router.get('/system/:shortName/remove_group/:groupId', isLoggedIn, function(req, res) {

            Permission.findOneAndRemove({
                shortName: req.params.shortName.toLowerCase(),
                '_id': new mongoose.Types.ObjectId(req.params.permissionId),
                role: { $lt : 20}
            }, function(err, permission) {

                  if (err) {
                    res.json({
                      success: false,
                      message: err
                    });
                    return;
                }

                if (!permission) {
                  res.json({
                    success: false,
                    message: "Permission not found"
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


};
