// Run with: npm test --workspace @openmhz/shared   (no database needed)
const test = require("node:test");
const assert = require("node:assert");
const { EventEmitter } = require("node:events");
const { wrap, errorHandler, installProcessHandlers, str, mongoUrl, sessionSecret, connectWithRetry } = require("..");

function fakeRes() {
  return {
    statusCode: 200, sends: 0, body: undefined, headersSent: false, writableEnded: false,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.sends++; this.headersSent = true; this.writableEnded = true; this.body = b; return this; },
  };
}
const req = { method: "GET", originalUrl: "/x" };
const quiet = (fn) => { const e = console.error, l = console.log; console.error = console.log = () => {}; try { return fn(); } finally { console.error = e; console.log = l; } };

test("wrap passes async rejections and sync throws to next", async () => {
  const errs = [];
  await wrap(async () => { throw new Error("async"); })(req, fakeRes(), (e) => errs.push(e.message));
  await wrap(() => { throw new Error("sync"); })(req, fakeRes(), (e) => errs.push(e.message));
  assert.deepStrictEqual(errs, ["async", "sync"]);
});

test("errorHandler answers 500 once without leaking the error", () => {
  const res = fakeRes();
  quiet(() => errorHandler(new Error("db password is hunter2"), req, res, () => {}));
  assert.strictEqual(res.statusCode, 500);
  assert.deepStrictEqual(res.body, { success: false, message: "Internal server error" });
});

test("errorHandler shows the message of a 4xx error and keeps 5xx statuses generic", () => {
  let res = fakeRes();
  quiet(() => errorHandler(Object.assign(new Error("bad input"), { status: 400 }), req, res, () => {}));
  assert.deepStrictEqual([res.statusCode, res.body.message], [400, "bad input"]);
  res = fakeRes();
  quiet(() => errorHandler(Object.assign(new Error("secret"), { status: 503 }), req, res, () => {}));
  assert.deepStrictEqual([res.statusCode, res.body.message], [503, "Internal server error"]);
});

test("errorHandler after a response: finished -> nothing, unfinished -> next", () => {
  let nextCalled = 0;
  const done = fakeRes(); done.headersSent = true; done.writableEnded = true;
  quiet(() => errorHandler(new Error("late"), req, done, () => nextCalled++));
  const partial = fakeRes(); partial.headersSent = true;
  quiet(() => errorHandler(new Error("mid-stream"), req, partial, () => nextCalled++));
  assert.strictEqual(done.sends, 0);
  assert.strictEqual(nextCalled, 1);
});

test("installProcessHandlers logs rejections and exits on uncaught exceptions", () => {
  const before = { r: process.listenerCount("unhandledRejection"), u: process.listenerCount("uncaughtException") };
  let exitCode = null;
  installProcessHandlers("test", { exit: (c) => { exitCode = c; } });
  const onReject = process.listeners("unhandledRejection").at(-1);
  const onUncaught = process.listeners("uncaughtException").at(-1);
  quiet(() => { onReject(new Error("r")); onUncaught(new Error("u")); });
  assert.strictEqual(exitCode, 1);
  process.removeListener("unhandledRejection", onReject);
  process.removeListener("uncaughtException", onUncaught);
  assert.strictEqual(process.listenerCount("unhandledRejection"), before.r);
  assert.strictEqual(process.listenerCount("uncaughtException"), before.u);
});

test("str only passes strings", () => {
  assert.deepStrictEqual([str("a"), str(["a"]), str({ a: 1 }), str(undefined)], ["a", undefined, undefined, undefined]);
});

test("mongoUrl: defaults, both env spellings, and escaped credentials", () => {
  assert.strictEqual(mongoUrl({}), "mongodb://mongo:27017/scanner");
  assert.strictEqual(mongoUrl({ MONGO_NODE_DRIVER_HOST: "db", MONGO_NODE_DRIVER_PORT: "1" }), "mongodb://db:1/scanner");
  assert.strictEqual(mongoUrl({ MONGO_HOST: "a", MONGO_NODE_DRIVER_HOST: "b" }), "mongodb://a:27017/scanner");
  assert.strictEqual(mongoUrl({ MONGO_USER: "u", MONGO_PASSWORD: "p@ss/w:rd" }, { log: false }), "mongodb://u:p%40ss%2Fw%3Ard@mongo:27017/scanner");
  assert.strictEqual(mongoUrl({ MONGO_USER: "u" }), "mongodb://mongo:27017/scanner", "user without password means no auth");
});

test("sessionSecret: SESSION_SECRET overrides the historical default", () => {
  assert.strictEqual(sessionSecret({}), "letthisbeyoursecret");
  assert.strictEqual(sessionSecret({ SESSION_SECRET: "s" }), "s");
});

test("connectWithRetry retries a failed connect and reconnects after a disconnect", async () => {
  const connection = new EventEmitter();
  connection.readyState = 0;
  const calls = [];
  let fail = 1;
  const mongoose = {
    connection,
    async connect(url, opts) {
      calls.push(opts);
      if (fail-- > 0) throw new Error("ECONNREFUSED");
      connection.readyState = 1;
    },
  };
  await quiet(async () => {
    connectWithRetry(mongoose, "mongodb://x/scanner", { maxPoolSize: 5 }, { retryMs: 10, reconnectMs: 10, name: "t" });
    await new Promise((r) => setTimeout(r, 40));
  });
  assert.strictEqual(calls.length, 2, "first attempt failed, the retry succeeded");
  assert.deepStrictEqual(calls[1], { autoIndex: false, maxPoolSize: 5 });

  quiet(() => { connection.readyState = 0; connection.emit("disconnected"); });
  await new Promise((r) => setTimeout(r, 40));
  assert.strictEqual(calls.length, 3, "reconnected after the disconnect");

  // A second call doesn't register the listeners again.
  const listeners = connection.listenerCount("disconnected");
  quiet(() => connectWithRetry(mongoose, "mongodb://x/scanner"));
  assert.strictEqual(connection.listenerCount("disconnected"), listeners);
});
