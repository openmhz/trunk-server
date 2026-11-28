// Run with: node --test test/*.test.js
// Needs a throwaway Mongo:  docker run -d --rm --name backend-test-mongo -p 27117:27017 mongo:8
// (or set TEST_MONGO_HOST / TEST_MONGO_PORT).
//
// Each test drives a real handler with inputs that used to crash the process
// or leave a request hanging, and checks it now answers exactly once.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const host = process.env.TEST_MONGO_HOST || "127.0.0.1";
const port = process.env.TEST_MONGO_PORT || "27117";
// uploads.js opens its own connections from these at require time.
process.env.MONGO_NODE_DRIVER_HOST = host;
process.env.MONGO_NODE_DRIVER_PORT = port;
process.env.MAILJET_KEY = process.env.MAILJET_KEY || "test";
process.env.MAILJET_SECRET = process.env.MAILJET_SECRET || "test";

const mongoose = require("mongoose");
const { wrap, errorHandler, str } = require("@openmhz/shared");
const { makeStartHandler } = require("../socket_start");
const clients = require("../client_registry");

const DB = `mongodb://${host}:${port}/scanner_test_${process.pid}`;

// A fake response that records every attempt to answer.
function fakeRes() {
  const res = {
    statusCode: 200,
    sends: 0,
    body: undefined,
    headersSent: false,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    contentType() { return this; },
    set(k, v) { this.headers[k] = v; return this; },
    send(body) {
      this.sends++;
      if (this.headersSent) throw new Error("ERR_HTTP_HEADERS_SENT");
      this.headersSent = true;
      this.body = body;
      return this;
    },
    json(obj) { return this.send(obj); },
    end() { return this.send(undefined); },
    render() { return this.send("rendered"); },
  };
  return res;
}

let calls, events, uploads, Call;

test.before(async () => {
  await mongoose.connect(DB, { serverSelectionTimeoutMS: 5000 });
  calls = require("../controllers/calls");
  events = require("../controllers/events");
  uploads = require("../controllers/uploads");
  Call = require("../models/call");
  await Call.create([
    { shortName: "sys", talkgroupNum: 100, time: new Date("2026-01-01T00:00:00Z"), len: 3, name: "a.m4a", path: "/p/", url: "u1" },
    { shortName: "sys", talkgroupNum: 200, time: new Date("2026-01-01T00:01:00Z"), len: 4, name: "b.m4a", path: "/p/", url: "u2" },
  ]);
});

test.after(async () => {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  // uploads.js and systems.js hold their own connections and timers.
  setTimeout(() => process.exit(0), 200).unref();
});

// ---------------------------------------------------------------- safety

test("wrap + errorHandler turn an async throw into one 500", async () => {
  const res = fakeRes();
  const req = { method: "GET", originalUrl: "/x" };
  await new Promise((resolve) => {
    wrap(async () => { throw new Error("boom"); })(req, res, (err) => {
      errorHandler(err, req, res, () => {});
      resolve();
    });
  });
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.sends, 1);
  assert.deepStrictEqual(res.body, { success: false, message: "Internal server error" });
});

test("errorHandler does not answer twice", () => {
  const res = fakeRes();
  res.send("already");
  errorHandler(new Error("late"), { method: "GET", originalUrl: "/x" }, res, () => {});
  assert.strictEqual(res.sends, 1);
});

test("str only passes strings", () => {
  assert.strictEqual(str("a"), "a");
  assert.strictEqual(str(["a"]), undefined);
  assert.strictEqual(str({ a: 1 }), undefined);
});

// ---------------------------------------------------------------- calls

function callsReq(query, params = {}) {
  return { params: { shortName: "SYS", ...params }, query };
}

test("filter-code as an array no longer crashes (the reproduced outage)", async () => {
  const res = fakeRes();
  await calls.get_calls(callsReq({ "filter-type": "talkgroup", "filter-code": ["1"] }), res);
  assert.strictEqual(res.sends, 1);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.calls.length, 2, "an unusable code is ignored, as if absent");
});

test("filter-code as an object no longer crashes", async () => {
  const res = fakeRes();
  await calls.get_older_calls(callsReq({ "filter-type": "group", "filter-code": { a: "1" } }), res);
  assert.strictEqual(res.sends, 1);
});

test("talkgroup filter still works", async () => {
  const res = fakeRes();
  await calls.get_calls(callsReq({ "filter-type": "talkgroup", "filter-code": "200" }), res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.calls.map((c) => c.talkgroupNum), [200]);
});

test("non-numeric talkgroup codes give 400 instead of a CastError", async () => {
  const res = fakeRes();
  await calls.get_calls(callsReq({ "filter-type": "talkgroup", "filter-code": "abc,def" }), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.sends, 1);
});

test("malformed group id gives 400 (common in production logs)", async () => {
  const res = fakeRes();
  await calls.get_calls(callsReq({ "filter-type": "group", "filter-code": "5e1f0c0e0c0e0c0e0c0e0c0ecall-id" }), res);
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.sends, 1);
});

test("unknown group id gives 404", async () => {
  const res = fakeRes();
  await calls.get_calls(callsReq({ "filter-type": "group", "filter-code": "5e1f0c0e0c0e0c0e0c0e0c0e" }), res);
  assert.strictEqual(res.statusCode, 404);
});

test("time filters and an invalid time", async () => {
  let res = fakeRes();
  await calls.get_older_calls(callsReq({ time: String(Date.parse("2026-01-01T00:00:30Z")) }), res);
  assert.deepStrictEqual(res.body.calls.map((c) => c.talkgroupNum), [100]);

  res = fakeRes();
  await calls.get_date_calls(callsReq({ time: "not-a-number" }), res);
  assert.strictEqual(res.sends, 1);
  assert.strictEqual(res.statusCode, 200);
});

test("unknown call id on /card answers 404 (used to throw a ReferenceError)", async () => {
  const res = fakeRes();
  await calls.get_card({ params: { id: "5e1f0c0e0c0e0c0e0c0e0c0e" } }, res);
  assert.strictEqual(res.statusCode, 404);
  assert.strictEqual(res.sends, 1);
});

test("starring answers once and does not call next()", async () => {
  const [call] = await Call.find({ talkgroupNum: 100 });
  const res = fakeRes();
  let nextCalled = false;
  await calls.add_star({ params: { id: call._id.toHexString() } }, res, () => { nextCalled = true; });
  assert.strictEqual(res.sends, 1);
  assert.strictEqual(JSON.parse(res.body).call.star, 1);
  assert.strictEqual(nextCalled, false);
});

// ---------------------------------------------------------------- events

test("POST /events with an empty body answers 400 (used to crash)", async () => {
  for (const body of [undefined, {}, { title: "t" }, { title: "t", callIds: "x" }, { title: "t", callIds: ["nope"] }]) {
    const res = fakeRes();
    await events.addNewEvent({ body }, res);
    assert.strictEqual(res.statusCode, 400, JSON.stringify(body));
    assert.strictEqual(res.sends, 1);
  }
});

test("POST /events caps the number of calls", async () => {
  const res = fakeRes();
  const ids = Array.from({ length: 1001 }, (_, i) => i.toString(16).padStart(24, "0"));
  await events.addNewEvent({ body: { title: "t", callIds: ids } }, res);
  assert.strictEqual(res.statusCode, 400);
});

test("uploading a missing podcast file rejects instead of crashing the process", async () => {
  await assert.rejects(events._internal.uploadFile("/nonexistent/podcast.m4a", "x"), /ENOENT/);
});

test("unknown event id answers 404", async () => {
  const res = fakeRes();
  await events.getEvent({ params: { id: "garbage" } }, res);
  assert.strictEqual(res.statusCode, 404);
});

// ---------------------------------------------------------------- uploads

function uploadReq(body, file) {
  return { params: { shortName: "sys" }, body, file };
}

function tempAudio() {
  const p = path.join(os.tmpdir(), `upload-test-${process.pid}-${Math.random()}.m4a`);
  fs.writeFileSync(p, "audio");
  return { path: p, originalname: "call.m4a" };
}

test("upload with no file answers once and does not throw", async () => {
  const res = fakeRes();
  let nextCalled = false;
  await uploads.upload(uploadReq({}), res, () => { nextCalled = true; });
  assert.strictEqual(res.sends, 1);
  assert.strictEqual(nextCalled, false);
});

test("upload with a non-numeric talkgroup answers 400 and removes the temp file", async () => {
  const file = tempAudio();
  const res = fakeRes();
  await uploads.upload(uploadReq({ talkgroup_num: "abc", start_time: "1700000000", source_list: "[]" }, file), res, () => {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(fs.existsSync(file.path), false);
});

test("upload with a non-string patch_list does not hang the recorder", async () => {
  const file = tempAudio();
  const res = fakeRes();
  await uploads.upload(uploadReq({ talkgroup_num: "1", start_time: "1700000000", source_list: "[]", patch_list: ["1", "2"], api_key: "k" }, file), res, () => {});
  assert.strictEqual(res.sends, 1); // unknown system → 500 "ShortName does not exist"
});

// ---------------------------------------------------------------- socket start

function fakeSocket(id) {
  return { id, emitted: [], emit(ev, msg) { this.emitted.push(msg); } };
}

test("socket start with no payload rejects the client instead of crashing", async () => {
  const handleStart = makeStartHandler({ clients, Group: null, firehoseKey: null });
  const sock = fakeSocket("s-empty");
  clients.add(sock.id, sock);
  await handleStart(sock, "ip", undefined);
  assert.strictEqual(clients.get(sock.id), undefined);
});

test("firehose start without a shortName no longer throws", async () => {
  const handleStart = makeStartHandler({ clients, Group: null, firehoseKey: "secret" });
  const sock = fakeSocket("s-fire");
  clients.add(sock.id, sock);
  await handleStart(sock, "ip", { filterType: "firehose", filterCode: "secret" });
  assert.strictEqual(clients.get(sock.id).firehose, true);
  clients.remove(sock.id);
});

test("a slow group lookup from an old start no longer kills the newer subscription", async () => {
  // The web app sends start(old system, old group) and then start(new system, all)
  // when moving between systems. The old group lookup finishing last used to
  // remove the client, silently stopping its live feed.
  let release;
  const slowGroup = {
    findOne: () => new Promise((resolve) => { release = () => resolve(null); }),
  };
  const handleStart = makeStartHandler({ clients, Group: slowGroup, firehoseKey: null });
  const sock = fakeSocket("s-race");
  clients.add(sock.id, sock);

  const first = handleStart(sock, "ip", { shortName: "oldsys", filterType: "group", filterCode: "5e1f0c0e0c0e0c0e0c0e0c0e" });
  await handleStart(sock, "ip", { shortName: "newsys", filterType: "all", filterCode: "" });
  release();
  await first;

  const entry = clients.get(sock.id);
  assert.ok(entry, "client still registered");
  assert.strictEqual(entry.shortName, "newsys");
  assert.strictEqual(clients.notify({ shortName: "newsys", talkgroupNum: 5, srcList: [] }, "m"), 1);
  clients.remove(sock.id);
});
