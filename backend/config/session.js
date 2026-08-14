/**
 * Session middleware for the backend.
 *
 * The backend issues no logins of its own - the account service does that. What
 * this does is *read* the session the account service already created, which is
 * possible because all three services share one signing secret, one cookie name,
 * one cookie domain and one Mongo store. Change any of those four here and the
 * backend silently stops recognising anyone.
 *
 * Exported as a single middleware instance so Express and Socket.IO can both use
 * it and see the same session for a given connection.
 */
const session = require("express-session");
const MongoStore = require("connect-mongo");

// Rolling, so this measures inactivity rather than age: an active listener is
// never signed out, one who stops visiting is asked to sign in again after 30
// days. The store ttl matches, otherwise the sessions collection grows forever.
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;

const cookie_domain = process.env['REACT_APP_COOKIE_DOMAIN'] != null ? process.env['REACT_APP_COOKIE_DOMAIN'] : '.hamrecorder.com';

// Same fail-loud rule as the account and admin services: no default, because a
// default that works is how a configuration gap becomes a security hole.
const sessionSecret = process.env['SESSION_SECRET'];
if (!sessionSecret) {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error("SESSION_SECRET is not set. Generate one with: openssl rand -base64 48");
  }
  console.warn("WARNING: SESSION_SECRET is not set. Using a throwaway value for this process - the backend will not recognise sessions issued by the account service.");
}

const mongo_host = typeof process.env['MONGO_HOST'] !== 'undefined' ? process.env['MONGO_HOST'] : 'mongo';
const mongo_port = typeof process.env['MONGO_PORT'] !== 'undefined' ? process.env['MONGO_PORT'] : 27017;
const mongo_user = process.env['MONGO_USER'];
const mongo_password = process.env['MONGO_PASSWORD'];

let mongoUrl;
if ((typeof mongo_user !== 'undefined') && (typeof mongo_password !== 'undefined')) {
  mongoUrl = 'mongodb://' + mongo_user + ':' + mongo_password + '@' + mongo_host + ':' + mongo_port + '/scanner';
} else {
  mongoUrl = 'mongodb://' + mongo_host + ':' + mongo_port + '/scanner';
}

const sessionMiddleware = session({
  secret: sessionSecret || require("crypto").randomBytes(48).toString("base64"),
  name: "sessionId",
  resave: false,
  // Critical here: without this, every anonymous request - including every
  // trunk-recorder upload - would create a session document.
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    domain: cookie_domain,
    maxAge: THIRTY_DAYS_MS
  },
  store: MongoStore.create({
    mongoUrl: mongoUrl,
    ttl: THIRTY_DAYS_SEC,
    autoRemove: 'interval',
    autoRemoveInterval: 240,
    // Without this, a rolling session writes to Mongo on every request, and the
    // player is a chatty client.
    touchAfter: 24 * 3600
  })
});

module.exports = sessionMiddleware;
