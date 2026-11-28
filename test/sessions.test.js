// Cross-app integration test: run the real account and admin servers (their own
// index.js and config/express.js), sign in on account, and use that session on
// admin, the way a contributor does in the browser.
//
// Run with `npm test` from the repo root. Needs a MongoDB; it uses TEST_MONGO_URL
// (default mongodb://127.0.0.1:27117) for the host and port, and writes one test
// user and its session to the scanner database, which it removes afterwards.
// Uses ports 3008 and 3009.
const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const { spawn } = require("node:child_process");

const repo = path.join(__dirname, "..");
const fromApp = (app, mod) => require(require.resolve(mod, { paths: [path.join(repo, app)] }));
const mongoose = fromApp("account", "mongoose");
const bcrypt = fromApp("account", "bcrypt");

const target = new URL(process.env.TEST_MONGO_URL || "mongodb://127.0.0.1:27117/test");
const MONGO_HOST = target.hostname;
const MONGO_PORT = target.port || "27017";

const ACCOUNT = "http://account.openmhz.test";
const ADMIN = "http://admin.openmhz.test";
const EMAIL = `session-test-${process.pid}@openmhz.test`;
const PASSWORD = "correct horse battery";

const env = {
  ...process.env,
  NODE_ENV: "test",
  MONGO_HOST,
  MONGO_PORT,
  MAILJET_KEY: "test",
  MAILJET_SECRET: "test",
  REACT_APP_ACCOUNT_SERVER: ACCOUNT,
  REACT_APP_ADMIN_SERVER: ADMIN,
  REACT_APP_FRONTEND_SERVER: "http://openmhz.test",
  REACT_APP_BACKEND_SERVER: "http://api.openmhz.test",
  REACT_APP_COOKIE_DOMAIN: ".openmhz.test",
};

const children = [];
function startServer(app) {
  const child = spawn(process.execPath, ["index.js"], { cwd: path.join(repo, app, "server"), env, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", (d) => { output += d; });
  child.stderr.on("data", (d) => { output += d; });
  children.push(child);
  child.output = () => output;
  return child;
}

async function waitFor(port, child) {
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}/authenticated`);
      return;
    } catch (err) {
      if (child.exitCode !== null) break;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`server on ${port} did not start:\n${child.output()}`);
}

let db;
test.before(async () => {
  await mongoose.connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/scanner`, { serverSelectionTimeoutMS: 5000 });
  db = mongoose.connection.db;
  const hash = bcrypt.hashSync(PASSWORD, 8);
  await db.collection("users").insertOne({
    email: EMAIL, password: hash, local: { email: EMAIL, password: hash },
    screenName: `sessiontest${process.pid}`, firstName: "Session", lastName: "Test",
    confirmEmail: true, terms: 1.1, admin: false,
  });
  const account = startServer("account");
  const admin = startServer("admin");
  await Promise.all([waitFor(3009, account), waitFor(3008, admin)]);
});

test.after(async () => {
  for (const child of children) child.kill();
  if (db) {
    const user = await db.collection("users").findOne({ email: EMAIL });
    await db.collection("users").deleteMany({ email: EMAIL });
    if (user) await db.collection("sessions").deleteMany({ session: { $regex: String(user._id) } });
  }
  await mongoose.disconnect();
});

let cookie;

test("sign in on account: session cookie for the whole domain, CORS for the account site", async () => {
  const res = await fetch("http://127.0.0.1:3009/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ACCOUNT },
    body: JSON.stringify({ email: EMAIL.toUpperCase(), password: PASSWORD }),
  });
  const body = await res.json();
  assert.strictEqual(body.success, true, JSON.stringify(body));
  assert.strictEqual(res.headers.get("access-control-allow-origin"), ACCOUNT);
  assert.strictEqual(res.headers.get("access-control-allow-credentials"), "true");
  const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("sessionId="));
  assert.ok(setCookie, "a sessionId cookie is set");
  assert.match(setCookie, /Domain=\.openmhz\.test/i);
  assert.match(setCookie, /HttpOnly/i);
  cookie = setCookie.split(";")[0];
});

test("the same session is signed in on account", async () => {
  const res = await fetch("http://127.0.0.1:3009/authenticated", { headers: { Cookie: cookie, Origin: ACCOUNT } });
  const body = await res.json();
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.user.email, EMAIL);
});

test("admin accepts the account session (shared store and secret)", async () => {
  const res = await fetch("http://127.0.0.1:3008/systems", { headers: { Cookie: cookie, Origin: ADMIN } });
  assert.strictEqual(res.status, 200, await res.clone().text());
  assert.strictEqual(res.headers.get("access-control-allow-origin"), ADMIN);
  const body = await res.json();
  assert.strictEqual(body.success, true);
});

test("admin without the cookie is signed out", async () => {
  const res = await fetch("http://127.0.0.1:3008/systems", { headers: { Origin: ADMIN } });
  assert.strictEqual(res.status, 401);
});

test("an unknown origin gets * (no credentials) on both servers", async () => {
  for (const port of [3008, 3009]) {
    const res = await fetch(`http://127.0.0.1:${port}/authenticated`, { headers: { Origin: "https://elsewhere.example" } });
    assert.strictEqual(res.headers.get("access-control-allow-origin"), "*", `port ${port}`);
  }
});
