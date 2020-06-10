import mongoose from "mongoose";
import System from "../models/system";



// -------------------------------------------

exports.getUserSystems = function(_id) {
    console.log("Listing Systems for: " + _id);
    System.find(
        {
          userId: mongoose.Types.ObjectId(_id)
        },
        function(err, systems) {
          if (err) {
            console.error("Error - ListSystems: " + err);
            return({ success: false, message: err });
          }
    
    
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
                  planType,
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
                  planType,
                  showScreenName
                }))(obj);
                rObj.id = obj._id;
                return rObj;
              });
    
    
              return({ success: true, systems: returnSys });
            }
          );
}

exports.listSystems = function(req, res, next) {
  return listSystems(req.user._id);
    }

