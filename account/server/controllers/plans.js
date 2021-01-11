const mongoose = require("mongoose");
const Plan = require("../models/plan");
const System = require("../models/system");

const stripeKeyPublishable = process.env.STRIPE_PUBLISHABLE_KEY;
const stripeKeySecret = process.env.STRIPE_SECRET_KEY;

const stripe = require("stripe")(stripeKeySecret);

var admin_email = process.env['ADMIN_EMAIL'] != null ? process.env['ADMIN_EMAIL'] : "luke@openmhz.com";
var site_name = process.env['SITE_NAME'] != null ? process.env['SITE_NAME'] : "OpenMHz";
var account_server = process.env['ACCOUNT_SERVER'] != null ? process.env['ACCOUNT_SERVER'] : "https://account.openmhz.com";
var cookie_domain = process.env['COOKIE_DOMAIN'] != null ? process.env['COOKIE_DOMAIN'] : '.openmhz.com'; //'https://s3.amazonaws.com/robotastic';

exports.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
};


function makeSystemsResponse(systems) {
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
    return returnSys;
}

function findSubscriptionItem(subscription, planId) {
    var items = subscription.items.data;

    var subscriptionItem = items.find(function (element) {
        return element.plan.id == planId;
    });
    return subscriptionItem;
};

// -------------------------------------------

// makes sure the plans a user is trying to update actually belong to them.
function validatePlans(systems, updatedPlans) {
    var validatedPlans = [];
    systems.forEach(function (system) {

        // Find the updated plan for that system.
        const updatedPlan = updatedPlans.find(function (element) {
            return element.shortName == system.shortName;
        })
        if (!updatedPlan) {
            console.log("ERROR: updated plan not found for ShortName");
        }

        // Update that systems plan type
        // TODO: add validation of plantype
        system.planType = updatedPlan.planType;
        validatedPlans.push({ shortName: system.shortName, planType: updatedPlan.planType });
    });
    return validatedPlans;
}
exports.updatePlans = async function (req, res, next) {
    const userId = mongoose.Types.ObjectId(req.user._id);

    if (!req.user.customerId) {
        console.log("ERROR: user does not have billing setup");
        res.json({
            success: false,
            message: "ERROR: user does not have billing setup"
        });
        return;
    }

    const updatedPlans = req.body.updatePlans;
    console.log(updatedPlans);

    try {
        var plan = await Plan.findOne({ userId: userId });

        // looks like the User does not have a plan yet

        if (!plan) {
            plan = new Plan({ userId: userId });
        }


        // Find all of the Users Systems
        var systems = await System.find({ userId: mongoose.Types.ObjectId(req.user._id) })


    } catch (err) {

        console.log("Error upate plans: " + err);
        res.json({
            success: false,
            message: err
        });
        return;
    }

    // For each of the User's Systems
    var validatedPlans = validatePlans(systems, updatedPlans);

    // Create the subscription object
    console.log("---------Validated Plans--------");
    console.log(validatedPlans);
    var proPlans = { plan: "plan_EQoJeqkAw6FCgy", quantity: 0 };
    var proPlanSystems = [];
    var proPlanQuantity = 0;
    validatedPlans.forEach(function (plan) {
        if (plan.planType == 10) {
            proPlanQuantity++;
            proPlans.quantity++;
            proPlanSystems.push(plan.shortName);
        }
    });

    if (!plan.subscriptionId) {
        //proPlans.metadata = proPlanSystems.join();
        var items = [];
        items.push(proPlans);
        //Subscribe the User

        console.log(subscription);
        try {
            var subscription = await stripe.subscriptions.create({
                customer: req.user.customerId,
                items: items
            });
            console.log(subscription);

            const subscriptionItem = findSubscriptionItem(subscription, "plan_EQoJeqkAw6FCgy");
            if (subscriptionItem) {
                plan.proSystemSubscription = { subscriptionItemId: subscriptionItem.id, quantity: proPlanQuantity, systems: proPlanSystems };
                plan.subscriptionId = subscription.id;
                await plan.save();
                systems.forEach(async function (system) { await system.save(); });
                // Save the updated Systems
                const returnSystems = makeSystemsResponse(systems);
                res.json({
                    success: true,
                    systems: returnSystems
                });
                return;
            }
        } catch (err) {
            console.log("Error upate plans: " + err);
            res.json({
                success: false,
                message: err
            });
            return;
        }
    } else {
        // we alreay have a Subscription for the User
        try {
            var subscriptionItem=null;
            // Check if the user has a Pro Plan subscription Item setup yet.
            if (plan.proSystemSubscription) {
                subscriptionItem = await stripe.subscriptionItems.update(plan.proSystemSubscription.subscriptionItemId,
                    {
                        quantity: proPlanQuantity,
                    });
            } else {
                // Create one if they don't
                subscriptionItem = await stripe.subscriptionItems.create(
                    {
                        subscription: plan.subscriptionId,
                        plan: "plan_EQoJeqkAw6FCgy",
                        quantity: proPlanQuantity,
                    });
            }

            if (subscriptionItem) {
                plan.proSystemSubscription = { subscriptionItemId: subscriptionItem.id, quantity: proPlanQuantity, systems: proPlanSystems };
                await plan.save();
                systems.forEach(async function (system) { await system.save(); });
                // Save the updated Systems
                const returnSystems = makeSystemsResponse(systems);
                res.json({
                    success: true,
                    systems: returnSystems
                });
                return;
            }

        } catch (err) {
            console.log("Error upate plans: " + err);
            res.json({
                success: false,
                message: err
            });
            return;
        }

    }

}

exports.getInvoices = async function (req, res, next) {
    if (!req.user.customerId) {
        console.log("ERROR: user does not have billing setup");
        res.json({
            success: false,
            message: "ERROR: user does not have billing setup"
        });
        return;
    }

    try {
        console.log("Trying to fetch invoices for: " + req.user.customerId);
       var invoices =  await stripe.invoices.list(  { limit: 12, customer: req.user.customerId });
        console.log(invoices);
        var obj = invoices.data.map(obj => {
            var rObj = (({
                amount_due,
                amount_paid,
                date,
                invoice_pdf,
                paid,
                status,
                description
            }) => ({
                amount_due,
                amount_paid,
                date,
                invoice_pdf,
                paid,
                status,
                description             
            }))(obj);
            rObj.id = obj._id;
            return rObj;
          });
        return res.json({
            success: true,
            invoices: obj
        });
    } catch (err) {
        console.log("Error retrieving licesnes: " + err);
        res.json({
            success: false,
            message: err
        });
        return;
    }
}
