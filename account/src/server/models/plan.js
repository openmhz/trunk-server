// Defining a User Model in mongoose
// Code modified from https://github.com/sahat/hackathon-starter
import bcrypt from "bcrypt-nodejs"
import mongoose from "mongoose"


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





export default mongoose.model("Plan", PlanSchema)
