const mongoose = require("mongoose");

// node --test runs each test file in its own process, in parallel, so every
// process gets its own database; sharing one let one file's setup and
// dropDatabase() wipe another's data mid-run.
function perProcessUrl(base) {
  const url = new URL(base);
  const name = (url.pathname.replace(/^\//, "") || "admin_test") + "_" + process.pid;
  url.pathname = "/" + name;
  return url.toString();
}
const MONGO_URL = perProcessUrl(process.env.TEST_MONGO_URL || "mongodb://127.0.0.1:27118/admin_test");

async function connect() {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
}
async function disconnect() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

// Minimal Express-like response that records every call so tests can assert "responds exactly once".
function fakeRes() {
  const res = {
    statusCode: 200,
    headersSent: false,
    locals: {},
    sends: [],
    headers: {},
    status(c) { this.statusCode = c; return this; },
    set(k, v) { this.headers[k] = v; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    json(b) { return this._send(b); },
    send(b) { return this._send(b); },
    end(b) { return this._send(b); },
    _send(b) {
      this.sends.push({ status: this.statusCode, body: b });
      this.headersSent = true;
      return this;
    },
    get body() { return this.sends[0] && this.sends[0].body; },
    get status_() { return this.sends[0] && this.sends[0].status; }
  };
  return res;
}

module.exports = { connect, disconnect, fakeRes };
