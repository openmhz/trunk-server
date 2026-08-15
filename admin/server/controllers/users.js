/**
 * User administration.
 *
 * Every route in here sits behind isAdmin, which requires both the admin flag
 * and a login within the last 12 hours. Accounts are owned by the account
 * service - this reads them and flips a small, deliberate set of flags. It does
 * not create accounts, set passwords or change anyone's profile.
 */
const mongoose = require("mongoose");
const User = require("../models/user");
const System = require("../models/system");
const LoginEvent = require("../models/login_event");

// The account service, over the internal docker network. Used only to reuse its
// confirmation email - duplicating the Mailjet code and its credentials into
// this service would mean two places to keep the email template correct.
const account_internal_url = process.env['ACCOUNT_INTERNAL_URL'] != null ? process.env['ACCOUNT_INTERNAL_URL'] : "http://account:3009";

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex/6969486#6969486
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Never send password hashes or the reset/confirm tokens to the browser. An
// admin has no use for them, and a token here would be a working password reset
// for somebody else's account.
const USER_FIELDS = "_id email callsign screenName firstName lastName city state country admin disabled disabledAt disabledReason plan planGrantedAt confirmEmail terms lastLogin sysCount";

const PLANS = ["free", "supporter"];

function fail(res, status, message) {
  res.status(status);
  res.json({ success: false, message: message });
}

// -------------------------------------------

exports.listUsers = async function (req, res, next) {
  const q = (req.query.q || "").trim();
  const filter = req.query.filter || "all";
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const query = {};

  if (q) {
    const rx = { '$regex': escapeRegExp(q), $options: 'i' };
    query.$or = [
      { callsign: rx },
      { email: rx },
      { firstName: rx },
      { lastName: rx },
      { city: rx }
    ];
  }

  if (filter === "admins") {
    query.admin = true;
  } else if (filter === "disabled") {
    query.disabled = true;
  } else if (filter === "unconfirmed") {
    query.confirmEmail = { $ne: true };
  } else if (filter === "supporters") {
    query.plan = "supporter";
  }

  try {
    const total = await User.countDocuments(query);
    const users = await User.find(query, USER_FIELDS)
      .sort({ lastLogin: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // How many systems each one owns, in a single query rather than one per
    // row. It is the thing that decides whether an account can be deleted, so
    // the list needs it up front.
    const ids = users.map(u => u._id);
    const counts = await System.aggregate([
      { $match: { userId: { $in: ids } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } }
    ]);
    const countByUser = {};
    counts.forEach(c => { countByUser[c._id.toString()] = c.count; });
    users.forEach(u => { u.systemCount = countByUser[u._id.toString()] || 0; });

    res.json({
      success: true,
      users: users,
      total: total,
      page: page,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    console.error("Error - listUsers: " + err);
    fail(res, 500, "Could not list users");
  }
}

// -------------------------------------------

exports.getUser = async function (req, res, next) {
  try {
    const user = await User.findById(req.params.userId, USER_FIELDS).lean();
    if (!user) return fail(res, 404, "No such account");

    const systems = await System.find({ userId: user._id }, "name shortName description systemType city state county country lastActive active").lean();
    const logins = await LoginEvent.find({ userId: user._id }).sort({ createdAt: -1 }).limit(25).lean();

    user.systems = systems;
    user.recentLogins = logins;
    res.json({ success: true, user: user });
  } catch (err) {
    console.error("Error - getUser: " + err);
    fail(res, 500, "Could not load that account");
  }
}

// -------------------------------------------

/**
 * Toggles the admin and disabled flags. Nothing else is writable here.
 *
 * Both guards below are about the same failure: an admin acting on their own
 * account and locking themselves - and possibly everyone - out of the portal.
 */
exports.updateUser = async function (req, res, next) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return fail(res, 404, "No such account");

    const isSelf = user._id.equals(req.user._id);

    if (typeof req.body.admin === "boolean") {
      if (isSelf) {
        return fail(res, 400, "You cannot change your own admin access.");
      }
      user.admin = req.body.admin;
    }

    // Note there is deliberately no isSelf guard here. The guards on admin and
    // disabled exist to stop an operator locking themselves out of the portal;
    // neither risk applies to a plan, and granting yourself Supporter is how you
    // test the feature. Do not "fix" this by making it consistent.
    if (typeof req.body.plan === "string") {
      if (!PLANS.includes(req.body.plan)) {
        return fail(res, 400, `Unknown plan "${req.body.plan}".`);
      }
      user.plan = req.body.plan;
      if (req.body.plan === "supporter") {
        user.planGrantedAt = new Date();
        user.planGrantedBy = req.user._id;
      } else {
        user.planGrantedAt = undefined;
        user.planGrantedBy = undefined;
      }
    }

    if (typeof req.body.disabled === "boolean") {
      if (isSelf) {
        return fail(res, 400, "You cannot disable your own account.");
      }
      user.disabled = req.body.disabled;
      if (req.body.disabled) {
        user.disabledAt = new Date();
        user.disabledReason = (req.body.disabledReason || "").toString().slice(0, 200);
      } else {
        user.disabledAt = undefined;
        user.disabledReason = undefined;
      }
    }

    await user.save();
    console.log(`Admin ${req.user.email} updated account ${user.email} - admin: ${user.admin} disabled: ${user.disabled} plan: ${user.plan}`);

    const updated = await User.findById(user._id, USER_FIELDS).lean();
    updated.systemCount = await System.countDocuments({ userId: user._id });
    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("Error - updateUser: " + err);
    fail(res, 500, "Could not update that account");
  }
}

// -------------------------------------------

/**
 * Deletes an account. Refuses if it still owns systems: those systems have API
 * keys in use by somebody's trunk-recorder and calls already uploaded, and
 * silently orphaning them is worse than making the admin deal with them first.
 */
exports.deleteUser = async function (req, res, next) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return fail(res, 404, "No such account");

    if (user._id.equals(req.user._id)) {
      return fail(res, 400, "You cannot delete your own account.");
    }

    const systemCount = await System.countDocuments({ userId: user._id });
    if (systemCount > 0) {
      return fail(res, 409, `That account still owns ${systemCount} system${systemCount === 1 ? "" : "s"}. Remove or reassign them first, or disable the account instead.`);
    }

    await User.deleteOne({ _id: user._id });
    // The login history is kept deliberately: it is the record of who signed in
    // from where, and deleting an account should not erase the audit trail.
    console.log(`Admin ${req.user.email} deleted account ${user.email}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error - deleteUser: " + err);
    fail(res, 500, "Could not delete that account");
  }
}

// -------------------------------------------

exports.resendConfirmation = async function (req, res, next) {
  try {
    const user = await User.findById(req.params.userId, "email confirmEmail");
    if (!user) return fail(res, 404, "No such account");
    if (user.confirmEmail) return fail(res, 400, "That address is already confirmed.");

    const response = await fetch(`${account_internal_url}/users/${user._id}/send-confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    const result = await response.json();

    if (!result.success) {
      console.error("Error - resendConfirmation: " + JSON.stringify(result));
      return fail(res, 502, result.message || "The account service could not send that email.");
    }
    console.log(`Admin ${req.user.email} resent the confirmation email to ${user.email}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error - resendConfirmation: " + err);
    fail(res, 502, "Could not reach the account service to send that email.");
  }
}

// -------------------------------------------

/**
 * The login audit trail. Newest first, optionally only failures, optionally
 * filtered by callsign, email or IP.
 */
exports.listLoginEvents = async function (req, res, next) {
  const q = (req.query.q || "").trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));

  const query = {};
  if (req.query.onlyFailures === "true") {
    query.success = false;
  }
  if (q) {
    const rx = { '$regex': escapeRegExp(q), $options: 'i' };
    query.$or = [{ email: rx }, { callsign: rx }, { ip: rx }, { city: rx }];
  }

  try {
    const total = await LoginEvent.countDocuments(query);
    const events = await LoginEvent.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Repeated failures from one address over the last day. A single failed
    // login is somebody mistyping a password; forty from one IP is the thing
    // this screen exists to make visible.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const suspects = await LoginEvent.aggregate([
      { $match: { success: false, createdAt: { $gte: since } } },
      {
        $group: {
          _id: "$ip",
          failures: { $sum: 1 },
          accounts: { $addToSet: "$email" },
          city: { $last: "$city" },
          region: { $last: "$region" },
          country: { $last: "$country" },
          lastAt: { $max: "$createdAt" }
        }
      },
      { $match: { failures: { $gte: 5 } } },
      { $sort: { failures: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      events: events,
      suspects: suspects.map(s => ({
        ip: s._id,
        failures: s.failures,
        accountCount: s.accounts.length,
        city: s.city,
        region: s.region,
        country: s.country,
        lastAt: s.lastAt
      })),
      total: total,
      page: page,
      pages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    console.error("Error - listLoginEvents: " + err);
    fail(res, 500, "Could not load login activity");
  }
}
