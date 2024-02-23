const mongoose = require("mongoose");
const System = require("../models/system");



// -------------------------------------------

exports.getUserSystems = async function (_id) {
  console.log("Listing Systems for: " + _id);
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const systems = await System.find({ userId: userId });
  if (systems == null) {
    return ({ success: false, message: err });
  }

  var returnSys = systems.map(obj => {
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
      planType,
      showScreenName
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
      planType,
      showScreenName
    }))(obj);
    rObj.id = obj._id;
    return rObj;
  });


  return ({ success: true, systems: returnSys });
}


exports.listSystems = function (req, res, next) {
  return listSystems(req.user._id);
}

