// Defining a User Model in mongoose
// Code modified from https://github.com/sahat/hackathon-starter

const mongoose = require("mongoose");


var SubscriptionSchema = mongoose.Schema({ subscriptionItemId: String, quantity: {type: Number, default: 0}, systems: [String] });
const PlanSchema = new mongoose.Schema({

    userId:  mongoose.Schema.Types.ObjectId,
    userPlan: {
        type: Number,
        default: 0
    },
    subscriptionId: String,
    proSystemSubscription: SubscriptionSchema
})





module.exports = mongoose.model("Plan", PlanSchema)
