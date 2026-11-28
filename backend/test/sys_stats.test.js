// Run with: node --test test/*.test.js
// Needs a throwaway Mongo:  docker run -d --rm --name stats-test-mongo -p 27117:27017 mongo:8
// (or set TEST_MONGO_HOST / TEST_MONGO_PORT).

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const host = process.env.TEST_MONGO_HOST || "127.0.0.1";
const port = process.env.TEST_MONGO_PORT || "27117";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sys-stats-"));
process.env.STATS_DIR = dir;

const mongoose = require("mongoose");
const System = require("../models/system");
const sysStats = require("../sys_stats");
const stats = require("../controllers/stats");

const DB = `mongodb://${host}:${port}/scanner_stats_test_${process.pid}`;

function fakeRes() {
  return {
    statusCode: 200, body: undefined,
    status(c) { this.statusCode = c; return this; },
    contentType() { return this; },
    send(b) { this.body = b; return this; },
  };
}

test.before(async () => {
  await mongoose.connect(DB);
  await System.create([
    { shortName: "sysa", name: "A" },
    { shortName: "sysb", name: "B", active: true, callAvg: 5 },
    { shortName: "sysc", name: "C" },
  ]);
});

test.after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  fs.rmSync(dir, { recursive: true, force: true });
  // node-schedule (required via controllers/stats) keeps the loop alive
  setImmediate(() => process.exit(process.exitCode || 0));
});

test("addCall -> shiftStats updates histories, systems, files and endpoints", async () => {
  sysStats.addCall({ shortName: "sysa", talkgroupNum: 100, len: 10, freq: 1, errorCount: 1, spikeCount: 0 });
  sysStats.addCall({ shortName: "sysa", talkgroupNum: 100, len: 20, freq: 1, errorCount: 0, spikeCount: 2 });
  sysStats.addCall({ shortName: "sysa", talkgroupNum: 200, len: 7, freq: 2, errorCount: 0, spikeCount: 0 });
  assert.strictEqual(sysStats.callTotals("sysa"), 3);

  await sysStats.shiftStats();

  const tg = sysStats.talkgroupStats("sysa");
  assert.strictEqual(tg[100].callCountHistory[0], 2);
  assert.strictEqual(tg[100].callAvgLenHistory[0], 15);
  assert.strictEqual(tg[200].callCountHistory[0], 1);
  assert.strictEqual(tg[100].calls, 0);
  assert.strictEqual(tg[100].callCountHistory.length, 96);
  assert.strictEqual(sysStats.callTotals("sysa"), 0);

  const a = await System.findOne({ shortName: "sysa" }).lean();
  assert.strictEqual(a.active, true);
  assert.strictEqual(a.callAvg, 3 / 15);
  assert.ok(a.lastActive instanceof Date);
  const b = await System.findOne({ shortName: "sysb" }).lean();
  assert.strictEqual(b.active, false);
  assert.strictEqual(b.callAvg, 0);
  assert.ok(!b.lastActive);

  // siteStats shape
  const res = fakeRes();
  sysStats.siteStats({ totalClients: 7 }, res);
  const site = JSON.parse(res.body);
  assert.deepStrictEqual(Object.keys(site).sort(), ["activeSystems", "totalClients", "uploadsPerMin"]);
  assert.strictEqual(site.uploadsPerMin.length, 96);
  assert.strictEqual(site.uploadsPerMin[95], 3 / 15);
  assert.strictEqual(site.activeSystems, 1);
  assert.strictEqual(site.totalClients, 7);

  // /<shortName>/stats response (callTotals is truthy because of the new call)
  sysStats.addCall({ shortName: "sysa", talkgroupNum: 100, len: 4, freq: 1, errorCount: 0, spikeCount: 0 });
  const r2 = fakeRes();
  stats.get_stats({ params: { shortName: "SysA" } }, r2);
  const body = JSON.parse(r2.body);
  assert.deepStrictEqual(Object.keys(body).sort(), ["callTotals", "talkgroupStats"]);
  assert.strictEqual(body.callTotals, 1);
  assert.strictEqual(body.talkgroupStats[100].callCountHistory[0], 2);

  // second shift moves history back
  await sysStats.shiftStats();
  const tg2 = sysStats.talkgroupStats("sysa");
  assert.strictEqual(tg2[100].callCountHistory[0], 1);
  assert.strictEqual(tg2[100].callCountHistory[1], 2);

  // persistence in existing formats, no temp files left, no decodeErrorsFreq file
  assert.deepStrictEqual(fs.readdirSync(dir).sort(), ["talkgroups.json", "uploadsPerMin.json"]);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, "uploadsPerMin.json"))).length, 96);
  assert.ok(JSON.parse(fs.readFileSync(path.join(dir, "talkgroups.json"))).sysa["100"]);
});

test("a failing stats dir is logged, not thrown", async () => {
  const old = process.env.STATS_DIR;
  process.env.STATS_DIR = path.join(dir, "missing", "dir");
  const orig = console.error;
  let logged = 0;
  console.error = () => { logged++; };
  try {
    await sysStats.shiftStats();
  } finally {
    console.error = orig;
    process.env.STATS_DIR = old;
  }
  assert.ok(logged >= 1);
});
