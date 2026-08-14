/**
 * Listener gate.
 *
 * The account service authenticates people; passport stores the user id on the
 * session as session.passport.user. All the backend has to do is read it back
 * and confirm the account is still real and still confirmed.
 *
 * Deliberately not used on /:shortName/upload - trunk-recorder is a headless
 * client that cannot hold a cookie, and authenticates with its API key instead.
 */
const User = require("../models/user");

function deny(res, message, reason) {
  res.status(401);
  res.contentType('json');
  res.send(JSON.stringify({
    success: false,
    message: message,
    reason: reason
  }));
}

/**
 * Returns the signed-in user, or null. Shared by the HTTP gate and the
 * Socket.IO handshake so both apply the same rules.
 */
async function resolveListener(session) {
  const userId = session && session.passport && session.passport.user;
  if (!userId) {
    return { error: "Sign in to listen", reason: "unauthenticated" };
  }

  const user = await User.findById(userId, "email confirmEmail admin callsign screenName");
  if (!user) {
    // The session outlived the account - treat it as signed out rather than
    // leaving a ghost session that half works.
    return { error: "Sign in to listen", reason: "unauthenticated" };
  }
  if (!user.confirmEmail) {
    return { error: "Confirm your email address to listen", reason: "unconfirmed email" };
  }

  return { user: user };
}

exports.resolveListener = resolveListener;

exports.requireListener = async function (req, res, next) {
  let result;
  try {
    result = await resolveListener(req.session);
  } catch (err) {
    console.error("Error resolving listener session: " + err);
    res.status(500);
    res.contentType('json');
    res.send(JSON.stringify({ success: false, message: "Could not verify session" }));
    return;
  }

  if (result.error) {
    return deny(res, result.error, result.reason);
  }

  req.listener = result.user;
  next();
};
