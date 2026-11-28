// Express setup shared by the four servers: site URLs, CORS, sessions and the
// startup banner.

// The public URL of each site, from the same REACT_APP_* settings the React
// builds use.
function siteUrls(env = process.env) {
  return {
    backend: env.REACT_APP_BACKEND_SERVER || "https://api.openmhz.com",
    frontend: env.REACT_APP_FRONTEND_SERVER || "https://openmhz.com",
    account: env.REACT_APP_ACCOUNT_SERVER || "https://account.openmhz.com",
    admin: env.REACT_APP_ADMIN_SERVER || "https://admin.openmhz.com",
    cookieDomain: env.REACT_APP_COOKIE_DOMAIN || ".openmhz.com",
  };
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch (err) {
    return null;
  }
}

// Our own origins: every site, its www/bare twin, and the React dev server
// (`npm start`) on port 3000 for each.
function firstPartyOrigins(urls = siteUrls()) {
  const origins = new Set();
  for (const url of [urls.backend, urls.frontend, urls.account, urls.admin]) {
    const origin = originOf(url);
    if (!origin) continue;
    const u = new URL(origin);
    const hosts = [u.hostname, u.hostname.startsWith("www.") ? u.hostname.slice(4) : "www." + u.hostname];
    for (const host of hosts) {
      origins.add(`${u.protocol}//${host}${u.port ? ":" + u.port : ""}`);
      origins.add(`${u.protocol}//${host}:3000`);
    }
  }
  return origins;
}

// The values every server sent (the second Allow-Headers assignment was the
// one that took effect).
const ALLOW_HEADERS = "Access-Control-Allow-Headers, Access-Control-Allow-Credentials, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Max-Age";
const ALLOW_METHODS = "GET,PUT,POST,DELETE,OPTIONS,WEBSOCKET";

// Logs each unknown origin at most once per interval, with a count, instead of
// on every request (the backend wrote ~350k such lines a week).
function rateLimitedOriginLog({ intervalMs = 60 * 60 * 1000, log = console.warn, now = Date.now } = {}) {
  const seen = new Map();
  return (origin, req) => {
    const entry = seen.get(origin);
    const t = now();
    if (entry && t - entry.since < intervalMs) {
      entry.count++;
      return;
    }
    const suppressed = entry ? entry.count : 0;
    seen.set(origin, { since: t, count: 0 });
    if (seen.size > 10000) seen.clear();
    log(`forcing CORS for: ${origin} url: ${req.originalUrl || req.url}` +
      (suppressed ? ` (${suppressed} more requests from it in the last hour)` : ""));
  };
}

// CORS for our sites. First-party origins get their own origin back (so the
// browser sends cookies); anything else gets "*", which keeps the public API
// usable from other sites. `blockOrigin(origin)` returning true answers 403.
function cors({ origins = firstPartyOrigins(), blockOrigin = () => false, logUnknown = rateLimitedOriginLog() } = {}) {
  return function corsMiddleware(req, res, next) {
    const origin = req.headers.origin;
    if (origin && origins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (origin && blockOrigin(origin)) {
      res.status(403).send("Forbidden");
      return;
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (origin && req.headers["user-agent"] !== "TrunkRecorder1.0") {
        logUnknown(origin, req);
      }
    }
    res.setHeader("Access-Control-Allow-Methods", ALLOW_METHODS);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", ALLOW_HEADERS);
    res.setHeader("Access-Control-Max-Age", "600");
    next();
  };
}

// The backend turns away copies of the site hosted on Vercel.
function isVercelOrigin(origin) {
  return origin.indexOf(".vercel.app") > -1;
}

// Common app settings and the startup banner.
function baseApp(app, { port, name }) {
  app.set("port", port);
  // X-Powered-By only helps someone fingerprint the server.
  app.disable("x-powered-by");
  // Behind nginx: use X-Forwarded-For for req.ip.
  app.enable("trust proxy");
  console.log("--------------------------");
  console.log(`===> 😊  Starting ${name} . . .`);
  console.log("===>  Environment: " + process.env.NODE_ENV);
}

// Login sessions for account and admin, stored in Mongo and shared across the
// subdomains through the cookie domain. The app passes its own express-session
// and connect-mongo (they differ in version between the apps).
function sessionOptions({ secret, mongoUrl, cookieDomain, MongoStore }) {
  return {
    resave: false,
    saveUninitialized: false,
    secret,
    proxy: true,
    name: "sessionId",
    cookie: {
      httpOnly: true,
      // nginx doesn't send X-Forwarded-Proto yet, so Express can't tell the
      // request was HTTPS; turning this on now would break login.
      secure: false,
      domain: cookieDomain,
    },
    store: MongoStore.create({
      mongoUrl,
      autoRemove: "interval",
      autoRemoveInterval: 240,
      touchAfter: 24 * 3600,
    }),
  };
}

module.exports = {
  siteUrls,
  firstPartyOrigins,
  cors,
  isVercelOrigin,
  rateLimitedOriginLog,
  baseApp,
  sessionOptions,
  ALLOW_HEADERS,
  ALLOW_METHODS,
};
