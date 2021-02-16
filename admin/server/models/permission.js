// Defining a User Model in mongoose
// Code modified from https://github.com/sahat/hackathon-starter

var mongoose = require("mongoose");



const PermissionSchema = new mongoose.Schema({
	userId:  mongoose.Schema.Types.ObjectId,
  systemId:  mongoose.Schema.Types.ObjectId,
	shortName: String,
	role: {
		type: Number,
		default: 0
	},
	ver: {
		type: Number,
		default: 1.2
	}
})



module.exports=mongoose.model("Permission", PermissionSchema)
