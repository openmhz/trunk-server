// MongoDB connection settings and a connect-with-retry shared by the servers.

// The scanner database URL, from MONGO_HOST / MONGO_PORT / MONGO_USER /
// MONGO_PASSWORD. MONGO_NODE_DRIVER_HOST / _PORT are still honoured (the upload
// path and the frontend server used those names); both default to mongo:27017.
function mongoUrl(env = process.env, { log = true } = {}) {
  const host = env.MONGO_HOST || env.MONGO_NODE_DRIVER_HOST || "mongo";
  const port = env.MONGO_PORT || env.MONGO_NODE_DRIVER_PORT || 27017;
  const user = env.MONGO_USER;
  const password = env.MONGO_PASSWORD;
  if (user && password) {
    if (log) console.log("Using authentication for MongoDB - user: " + user);
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/scanner`;
  }
  return `mongodb://${host}:${port}/scanner`;
}

// Session cookie signing secret. SESSION_SECRET overrides the historical
// default; changing it signs everyone out once.
function sessionSecret(env = process.env) {
  return env.SESSION_SECRET || "letthisbeyoursecret";
}

const DEFAULT_OPTIONS = {
  // Indexes are created by mongo/db.sh, not by Mongoose at startup (an index
  // added to a model would otherwise start a build on 80M+ calls at deploy).
  autoIndex: false,
};

// Connect mongoose's default connection, retrying until Mongo is reachable and
// reconnecting after a disconnect. The servers log and keep running on an
// unhandled rejection, so without this a failed first connect would leave them
// up with no database. Listeners are registered once per connection.
function connectWithRetry(mongoose, url, options = {}, { retryMs = 5000, reconnectMs = 1000, name = "mongo" } = {}) {
  const connection = mongoose.connection;
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let connecting = false;

  const connect = async () => {
    if (connecting || connection.readyState !== 0) return;
    connecting = true;
    try {
      await mongoose.connect(url, opts);
    } catch (err) {
      console.error(`[${name}] Mongo connect failed, retrying in ${retryMs / 1000}s: ${(err && err.message) || err}`);
      setTimeout(connect, retryMs);
    } finally {
      connecting = false;
    }
  };

  if (!connection.__openmhzRetry) {
    connection.__openmhzRetry = true;
    connection.on("connecting", () => console.log(`[${name}] Mongoose is connecting`));
    connection.on("connected", () => console.log(`[${name}] Mongoose is connected`));
    connection.on("disconnecting", () => console.log(`[${name}] Mongoose is disconnecting`));
    connection.on("error", (err) => console.error(`[${name}] Mongoose error: ${err}`));
    connection.on("disconnected", () => {
      console.log(`[${name}] Mongoose disconnected`);
      setTimeout(connect, reconnectMs);
    });
  }

  connect();
  return connect;
}

module.exports = { mongoUrl, sessionSecret, connectWithRetry, DEFAULT_OPTIONS };
