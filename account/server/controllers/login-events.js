/**
 * The login audit trail.
 *
 * Every sign-in attempt is recorded here - who, from where, and whether it
 * worked. Recording is deliberately best-effort: a failure to write the audit
 * row must never turn a successful login into an error, so everything below
 * swallows its own exceptions and logs instead.
 */
const geoip = require("geoip-lite");
const LoginEvent = require("../models/login_event");

/**
 * Express hands back "::ffff:203.0.113.5" for IPv4 clients on a dual-stack
 * socket, and geoip-lite does not recognise that form.
 */
function normalizeIp(ip) {
  if (!ip) return "";
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

/**
 * City-level location for an IP, from a database bundled with geoip-lite - no
 * external lookup service, so nobody's IP address leaves this server.
 *
 * The data is a snapshot: it goes stale, and it is approximate at the best of
 * times. Treat it as a hint about where a login came from, not as a fact.
 */
function locate(ip) {
  if (!ip) return {};
  try {
    const geo = geoip.lookup(ip);
    if (!geo) return {};
    return { city: geo.city || "", region: geo.region || "", country: geo.country || "" };
  } catch (err) {
    console.error("Error - geoip lookup: " + err);
    return {};
  }
}

/**
 * @param req      the express request, for IP and user agent
 * @param details  { success, reason, email, userId, callsign }
 */
exports.record = async function (req, details) {
  try {
    const ip = normalizeIp(req.ip || (req.connection && req.connection.remoteAddress));
    const place = locate(ip);

    await LoginEvent.create({
      userId: details.userId || undefined,
      email: (details.email || "").toString().toLowerCase().slice(0, 200),
      callsign: (details.callsign || "").toString().toLowerCase(),
      success: !!details.success,
      reason: details.reason || (details.success ? "ok" : "unknown"),
      ip: ip,
      city: place.city,
      region: place.region,
      country: place.country,
      // Truncated: user agents are attacker-controlled and can be arbitrarily
      // long, and nothing needs more than this to be recognisable.
      userAgent: (req.headers["user-agent"] || "").toString().slice(0, 300),
      createdAt: new Date()
    });
  } catch (err) {
    console.error("Error - could not record login event: " + err);
  }
}

exports.normalizeIp = normalizeIp;
